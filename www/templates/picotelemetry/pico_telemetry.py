# ================================================================
# File:        main.py
# Project:     PicoTelemetry
# Brief:       Simple HTTP telemetry server for Raspberry Pi Pico W
# Version:     PicoTelemetry v20260602
# Description: This script runs a basic TCP socket server on port 80 and listens to client connections.
#              After successful network connection, the onboard LED lights.
#              Client Request Pico IP address: 192.168.1.115
#              HTTP Request: http://pico-ip/telemetry
#              HTTP Response: {"temp": 20.5, "rssi_dbm": -36}
# Hardware:    Raspberry Pico WH, Pico To Hat Board
# Wiring:      Onboard LED = 'LED'
# ================================================================

# Imports
import machine
import time
import socket
import network
from machine import ADC

# Global constants
import config

# Script constants
VERSION = "PicoTelemetry v20260602"
SERVER_PORT = 80

# ================================================================
# Hardware Initialization
# ================================================================

# Onboard LED (configured in config.py)
onboard_led = machine.Pin(config.PIN_LED_ONBOARD, machine.Pin.OUT)

# Internal temperature sensor connected to ADC4
pico_temp_sensor = ADC(4)

# ================================================================
# Helper
# ================================================================

def celsius_to_fahrenheit(temp_celsius): 
    temp_fahrenheit = temp_celsius * (9/5) + 32 
    return temp_fahrenheit

# ================================================================
# Temperature Sensor
# ================================================================

def get_pico_temperature():
    """
    Read Pico internal temperature sensor and return Celsius.
    """
    raw_reading = pico_temp_sensor.read_u16()
    # Convert raw to voltage > 3.3V = 65535
    voltage = raw_reading * (3.3 / 65535.0)
    # Get temperature using formula from datasheet
    celsius = 27.0 - ((voltage - 0.706) / 0.001721)

    # Return rounded number 1 digit
    return round(celsius, 1)

# ================================================================
# WiFi
# ================================================================

def connect_wifi():
    """
    Connect to WiFi network.

    Returns:
        True  - WiFi connected
        False - WiFi connection failed
    """
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)

    # Already connected
    if wlan.isconnected():
        print("[connect_wifi] Connected ip=", wlan.ifconfig()[0])
        onboard_led.on()
        return True

    print("[connect_wifi] Connecting to WiFi...")
    wlan.connect(config.WIFI_SSID, config.WIFI_PASSWORD)

    # Wait for connection (10s timeout)
    timeout = 10

    while not wlan.isconnected() and timeout > 0:
        time.sleep(1)
        timeout -= 1

    if wlan.isconnected():
        print("[connect_wifi] WiFi connected. IP:", wlan.ifconfig()[0])
        onboard_led.on()
        return True

    print("[connect_wifi][E] WiFi connection failed")
    onboard_led.off()
    return False


# ================================================================
# HTTP Server
# ================================================================

def handle_connections(server_socket):
    """
    Listen and handle incoming HTTP client requests.
    """
    wlan = network.WLAN(network.STA_IF)

    while True:
        client_socket = None

        try:
            # Wait for incoming client
            client_socket, client_address = server_socket.accept()
            print("[handle_connections] client remote ip=", client_address)

            # Read request (max 500 bytes)
            request = client_socket.recv(500).decode("utf-8")

            if not request:
                continue

            # Parse first HTTP line
            first_line = request.split("\r\n")[0]
            # print("[handle_connections]", first_line)

            parts = first_line.split(" ")

            if len(parts) < 2:
                continue

            path = parts[1]

            # Ignore browser favicon requests
            if path == "/favicon.ico":
                continue

            # ----------------------------------------------------
            # Telemetry JSON endpoint
            # ----------------------------------------------------
            if path == "/telemetry":

                temperature = get_pico_temperature()

                try:
                    rssi = wlan.status("rssi")
                except:
                    rssi = -99

                json_payload = (
                    f'{{"temp": {temperature}, "rssi_dbm": {rssi}}}'
                )

                print("[handle_connections] payload=", json_payload)

                response = (
                    "HTTP/1.1 200 OK\r\n"
                    "Content-Type: application/json\r\n"
                    f"Content-Length: {len(json_payload)}\r\n"
                    "Connection: close\r\n"
                    "\r\n"
                    f"{json_payload}"
                )

            # ----------------------------------------------------
            # Default response
            # ----------------------------------------------------
            else:

                payload = "OK"

                response = (
                    "HTTP/1.1 200 OK\r\n"
                    "Content-Type: text/plain\r\n"
                    f"Content-Length: {len(payload)}\r\n"
                    "Connection: close\r\n"
                    "\r\n"
                    f"{payload}"
                )

            # Send response
            client_socket.send(response)

        except Exception as e:
            print("[handle_connections][E]", e)

        finally:
            if client_socket:
                try:
                    client_socket.close()
                except:
                    pass

# ================================================================
# Main
# ================================================================

def main():
    """
    Connect WiFi and start HTTP server.
    """
    print("[main]", VERSION)

    if not connect_wifi():
        print("[main][E] Cannot start server without WiFi")
        return

    server_socket = None

    try:
        # Create TCP server socket
        server_socket = socket.socket(
            socket.AF_INET,
            socket.SOCK_STREAM
        )

        # Allow immediate reuse after restart
        server_socket.setsockopt(
            socket.SOL_SOCKET,
            socket.SO_REUSEADDR,
            1
        )

        server_socket.bind(("", SERVER_PORT))
        server_socket.listen(5)

        print("[main] Listening on port", SERVER_PORT)

        # Start server loop
        handle_connections(server_socket)

    except Exception as e:
        print("[main][E]", e)

    finally:
        if server_socket:
            try:
                server_socket.close()
                print("[main] Socket closed")
            except:
                pass


# ================================================================
# Run Application
# ================================================================

main()
