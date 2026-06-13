"""File: pico_servo_control.py.

Brief:  Set the angle of a servo connected to Raspberry Pi Pico WH via WiFi.
Date:   2026-06-13
Author: Robert W.B. Linn (c) 2026 MIT
"""

import machine
import network
import socket
import time

import config

# Global Constants
VERSION = "ServoControl_MicroPython_v20260613"
SERVER_PORT = 80

# Servo Configuration
SERVO1_PIN_NR = 4
ANGLE_BASE = 90
ANGLE_OPEN = 90
ANGLE_CLOSE = 135

# State Variables
current_angle = ANGLE_BASE

# Initialize GPIO & PWM
onboard_led = machine.Pin(config.PIN_LED_ONBOARD, machine.Pin.OUT)
servo_pin = machine.Pin(SERVO1_PIN_NR, machine.Pin.OUT)
servo_pwm = machine.PWM(servo_pin, freq=50)


def set_angle(angle):
    """Sets the servo angle using nanoseconds on the Pico W."""
    global current_angle
    current_angle = angle

    # Fast integer math instead of slow floats (maps 0-180 to 500k-2500k)
    ns = int(500000 + (angle * 2000000) // 180)
    servo_pwm.duty_ns(ns)


def connect_wifi():
    """Connects to the local Wi-Fi network and manages the status LED."""
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)

    if wlan.isconnected():
        wlan.disconnect()
        time.sleep_ms(500)

    print("[connect_wifi] Connecting to network...")
    wlan.connect(config.WIFI_SSID, config.WIFI_PASSWORD)

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


def handle_connections(server_socket):
    """Listens for connections and automatically handles network drops."""
    wlan = network.WLAN(network.STA_IF)
    server_socket.settimeout(1.0)

    while True:
        try:
            # 1. Check Wi-Fi Link Health
            if not wlan.isconnected():
                print("[handle_connections][W] Connection lost! Repairing...")
                onboard_led.off()

                try:
                    server_socket.close()
                except OSError:
                    pass

                while not connect_wifi():
                    print("[handle_connections][W] Retry WiFi in 5s...")
                    time.sleep(5)

                server_socket = socket.socket(
                    socket.AF_INET, socket.SOCK_STREAM
                )
                server_socket.bind(("", SERVER_PORT))
                server_socket.listen(1)
                server_socket.settimeout(1.0)
                print("[handle_connections] Server socket successfully restored.")
                continue

            # 2. Accept incoming client
            try:
                client_socket, client_address = server_socket.accept()
            except OSError:
                continue

            # 3. Handle Client Session safely
            try:
                print("[handle_connections] Remoteip=", client_address)
                request = client_socket.recv(500).decode("utf-8")

                if request:
                    first_line = request.split("\r\n")[0]
                    print("[handle_connections] Parsing line:", first_line)

                    parts = first_line.split(" ")
                    if len(parts) > 1:
                        path = parts[1]

                        if path == "/favicon.ico":
                            continue

                        # Routing Logic
                        if path == "/open":
                            print("[handle_connections] Servo Action: Open")
                            set_angle(ANGLE_OPEN)

                        elif path == "/close":
                            print("[handle_connections] Servo Action: Close")
                            set_angle(ANGLE_CLOSE)

                        else:
                            num_str = path.replace("/", "")
                            if num_str.isdigit():
                                percentage = int(num_str)
                                percentage = max(0, min(100, percentage))

                                # Scaled integer math calculation
                                diff = ANGLE_OPEN - ANGLE_CLOSE
                                target_angle = ANGLE_CLOSE + (
                                    (percentage * diff) // 100
                                )

                                print(
                                    "[handle_connections] Percent:",
                                    percentage,
                                    "% -> Target:",
                                    target_angle,
                                )
                                set_angle(target_angle)

                    response = (
                        "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nOK"
                    )
                    client_socket.send(response)

            except Exception as client_err:
                print("[handle_connections][E] Client Error:", client_err)

            finally:
                # Guarantees the socket closes even if parsing crashes
                client_socket.close()

        except Exception as e:
            print("[handle_connections][E] Global Loop Error:", e)
            time.sleep(1)


def app_start():
    """Application entry point."""
    print("[app_start]", VERSION)

    set_angle(ANGLE_BASE)
    time.sleep_ms(50)
    print("[app_start] Init servo angle=", current_angle)

    if connect_wifi():
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.bind(("", SERVER_PORT))
        server_socket.listen(1)
        print("[app_start] Done. Listening on port", SERVER_PORT)
        handle_connections(server_socket)


# Run the application
app_start()
