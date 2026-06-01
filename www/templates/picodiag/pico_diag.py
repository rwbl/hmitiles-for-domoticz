"""
File: pico_diag.py
Brief: Request the Raspberry Pi Pico WH (Pico) internal chip temperature and RSSI via HTTP GET request.
Date: 2026-05-31
Author: Robert W.B. Linn (c) 2026 MIT

Description:
This script runs a basic TCP socket server on port 80 and listens to client connections.
After successful network connection, the onboard LED lights.

Client Request:
Client HTTP Requests with Pico IP address: 192.168.1.115
Chip Temperature:
- Request: http://pico-ip/diag
- Response: {"temp": 20.5, "rssi_dbm": -36}

Why using (/diag)?
This is highly efficient, blazing-fast, and remarkably easy to debug by simply typing it directly into any browser address bar.

Hardware:
- Raspberry Pico WH
- Pico To Hat Board

Wiring:
- Onboard LED = 'LED'
"""

# Imports
import machine
import time
import socket
import network
from machine import ADC

# Defines various global constants
import config

# Process_Globals
VERSION = "PicoDiag_MicroPython_v20260601"
SERVER_PORT = 80

# Onboard LED - see config.py

# Initialize GPIO
onboard_led = machine.Pin(config.PIN_LED_ONBOARD, machine.Pin.OUT)

# Temperature Sensor
pico_temp_sensor = ADC(4)

def get_pico_temperature():
    """Reads the raw silicon internal voltage step and parses to Celsius."""
    raw_reading = pico_temp_sensor.read_u16()
    voltage = raw_reading * (3.3 / 65535.0)
    celsius = 27.0 - ((voltage - 0.706) / 0.001721)
    return round(celsius, 1)

# WiFi
def connect_wifi():
    """Connects to the local Wi-Fi network and manages the status LED."""
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    
    # If already connected from a previous run, disconnect first to ensure a clean state
    if wlan.isconnected():
        wlan.disconnect()
        time.sleep_ms(500)
        
    print("[connect_wifi] Connecting to network...")
    wlan.connect(config.WIFI_SSID, config.WIFI_PASSWORD)
    
    # Wait for connection with a timeout
    timeout = 10
    while not wlan.isconnected() and timeout > 0:
        time.sleep(1)
        timeout -= 1
            
    if wlan.isconnected():
        print("[connect_wifi] WiFi connected. IP:", wlan.ifconfig()[0])
        onboard_led.on()
        return True
    else:
        print("[connect_wifi][E] WiFi connection failed")
        onboard_led.off()
        return False

# --- AppStart ---
def app_start():
    print("[app_start]", VERSION)
    
    # Connect to WiFi
    if connect_wifi():
        # Initialize TCP Server Socket
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        # CRITICAL FIX 1: Allow the port to be immediately reused upon a soft reboot 
        # or automated data refresh transaction
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_socket.bind(('', SERVER_PORT))
        server_socket.listen(5)
        server_socket.settimeout(1.0)
        print("[app_start] Done. Listening on port", SERVER_PORT)
        
        # Start listening loop (Equivalent to OnConnection / AsyncStream)
        handle_connections(server_socket)

# --- Communication ---
def handle_connections(server_socket):
    """Listens for connections and automatically handles network drops."""
    wlan = network.WLAN(network.STA_IF)
    
    # Set a socket timeout (in seconds) so accept() does not block forever.
    # This allows us to break out and check the Wi-Fi link health regularly.
    server_socket.settimeout(1.0)
    
    while True:
        try:
            # 1. Check Wi-Fi Health Link
            if not wlan.isconnected():
                print("[handle_connections][W] WiFi connection lost! Repairing...")
                onboard_led.off()
                
                # Clean up old socket safely
                try:
                    server_socket.close()
                except:
                    pass
                
                # Attempt to reconnect
                while not connect_wifi():
                    print("[handle_connections][W] Retry WiFi connection in 5s...")
                    time.sleep(5)
                
                # Rebuild socket after successful reconnection
                server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                # CRITICAL FIX 1: Allow the port to be immediately reused upon a soft reboot 
                # or automated data refresh transaction
                server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                server_socket.bind(('', SERVER_PORT))
                server_socket.listen(5)
                server_socket.settimeout(1.0)
                print("[handle_connections] Server socket successfully restored.")
                continue

            # 2. Accept incoming client
            try:
                client_socket, client_address = server_socket.accept()
            except OSError:
                # This exception happens every 1 second when no client connects.
                # It is perfectly normal and allows the loop to check the Wi-Fi health above.
                continue

            print("[handle_connections] Remoteip=", client_address)
            
            # Read incoming data (Max 500 bytes)
            request = client_socket.recv(500).decode('utf-8')
            
            if request:
                first_line = request.split('\r\n')[0]
                print("[handle_connections] Parsing line:", first_line)
                
                parts = first_line.split(' ')
                if len(parts) > 1:
                    path = parts[1] 
                    
                    # Ignore browser favicon requests cleanly
                    if path == "/favicon.ico":
                        client_socket.close()
                        continue

                    # --- TELEMETRY JSON ENDPOINT ---
                    if path == "/diag":
                        live_temp = get_pico_temperature()
                        
                        # Fetch Wi-Fi status indicators safely
                        try:
                            live_rssi = wlan.status('rssi')
                        except:
                            live_rssi = -99  # Safe fallback if read hits a hardware hitch
                        
                        # FIX: Structured strict JSON format using explicit string mappings
                        json_payload = f'{{"temp": {live_temp}, "rssi_dbm": {live_rssi}}}'
                        print("[handle_connections] Dispatching payload:", json_payload)
                        
                        # Send application/json content-type layout packet
                        response = (
                            "HTTP/1.1 200 OK\r\n"
                            "Content-Type: application/json\r\n"
                            "Connection: close\r\n\r\n"
                            f"{json_payload}"
                        )
                        client_socket.send(response)
                        client_socket.close()
                        continue 
                
                # Send a clean HTTP response
                response = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nOK"
                client_socket.send(response)
                time.sleep_ms(20)
                
            client_socket.close()
            
        except Exception as e:
            print("[handle_connections][E] Global Loop Error:", e)
            time.sleep(1)

# Run the application
app_start()

