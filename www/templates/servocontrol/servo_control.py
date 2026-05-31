"""
File: servo_control.py
Brief: Set the angle of a servo connected to Raspberry Pi Pico via WiFi.
Date: 2026-05-31
Author: Robert W.B. Linn (c) 2026 MIT

Description:
This script runs a basic TCP socket server on port 80 to
control a hobby servo motor via a web browser or client application.
It maps HTTP paths and raw percentage paths to specific servo angles.
The servo angles are listed below.
After successful network connection, the onboard LED lights.

Examples setting servo angle:
Pico WH IP address: 192.168.1.115
- Open (90 degrees): http://pico-ip/open
- Close (135 degrees): http://pico-ip/close
- Position (0-100 which is converted to 135-90 degrees): http://pico-ip/0
Note the position 0-100% is converted to an angle close to open.

Why using (/open, /close, /0-100)?
This is highly efficient, blazing-fast, and remarkably easy to debug by simply typing it directly into any browser address bar.

Hardware:
- Raspberry Pico WH
- Pico To Hat

Wiring:
  Servo  = Raspberry Pi Pico WH
- VCC    =  Pin 40 (VBUS / 5V)
- GND    -> Pin 38 (GND)
- Signal -> Pin 6  (GPIO4)
"""

# Imports
import machine
import time
import socket
import network

# Defines various global constants
import config

# Process_Globals
VERSION = "ServoControl_MicroPython_v20260531"
SERVER_PORT = 80

# Servo configuration
SERVO1_PIN_NR = 4
ANGLE_BASE = 90
ANGLE_OPEN = 90
ANGLE_CLOSE = 135
current_angle = ANGLE_BASE

# Onboard LED
# ONBOARDLED_PINNR = 2

# Initialize GPIO
onboard_led = machine.Pin(config.PIN_LED_ONBOARD, machine.Pin.OUT)
servo_pin = machine.Pin(SERVO1_PIN_NR, machine.Pin.OUT)

# Initialize Servo using PWM (50Hz is standard for servos)
servo_pwm = machine.PWM(servo_pin, freq=50)

# --- Helper Functions ---
def set_angle(angle):
    """
    Sets the servo angle using nanoseconds on the Pico W.
    0 degrees   = 500,000 ns (0.5ms)
    180 degrees = 2,500,000 ns (2.5ms)
    """
    global current_angle
    current_angle = angle
    
    # Calculate nanoseconds: map 0-180 degrees to 500k-2500k ns
    ns = int(500000 + (angle / 180.0) * 2000000)
    
    # Pico W native function for nanosecond control
    servo_pwm.duty_ns(ns) 

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
    
    # Set base position
    set_angle(ANGLE_BASE)
    time.sleep_ms(50)
    print("[app_start] Init servo angle=", current_angle)
    
    # Connect to WiFi
    if connect_wifi():
        # Initialize TCP Server Socket
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.bind(('', SERVER_PORT))
        server_socket.listen(1)
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
                server_socket.bind(('', SERVER_PORT))
                server_socket.listen(1)
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
                    
                    # --- Routing Logic ---
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
                            
                            # Inverted math: 0% = Close (135), 100% = Open (90)
                            target_angle = ANGLE_CLOSE + (percentage / 100.0) * (ANGLE_OPEN - ANGLE_CLOSE)
                            
                            print("[handle_connections] Servo Percent:", percentage, "% -> Target Angle:", target_angle)
                            set_angle(target_angle)
                
                # Send a clean HTTP response
                response = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nOK"
                client_socket.send(response)
                
            client_socket.close()
            
        except Exception as e:
            print("[handle_connections][E] Global Loop Error:", e)
            time.sleep(1)

# Run the application
app_start()
