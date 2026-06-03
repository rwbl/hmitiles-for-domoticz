# Blueprint Pico-Servo-Control

This quick start outlines how to control a servo connected to a Raspberry Pi Pico WH (Pico).
.

## Screenshots

![Pico Servo Control](picoservocontrol.png)

---

## Create Domoticz Virtual Devices

Before writing the HTML layout, ensure you have created a virtual dummy device inside your Domoticz utility hardware panel. 
Note down their unique **IDX numbers** from your device list:

From the Domoticz hardware VirtualSensors, add the following devices:
- **Device 1 :** Type Light/Switch, SubType Switch, Switch Type: On/Off, Idx 21
- **Device 2 :** Type Light/Switch, SubType Switch, Switch Type: Dimmer, Idx 20

**Note**
The Switch Type is set after the devices have been created. 
In the WebUI, go to the Switches tab and select the device > Edit > change Switch Type accordingly.

The Idx numbers are examples as also referred in the automation script.

---

## Set Up Project Folder

To keep your files modular and organized, deploy your new custom template inside your standard Domoticz templates path alongside the shared common styles and engine files:

```
...domoticz/www/templates/
├── hmitiles.css               	# Shared common styling library file
├── hmitiles.js                	# Shared common javascript core engine
├── PicoServoControl.html  		# Domoticz custom page wrapper (created below)
└── picoservocontrol/			# Custom page folder
    └── index.html             	# Your new custom layout file (created Below)
```

---

## Write the HTML Structure (`index.html`)

Create a new file named `index.html` inside your `picoservocontrol/` subfolder, open it in any text editor, and paste the following clean structure. 

**Notes**

* In the head section there are links backward (`../`) to reuse the shared asset engine files.
* Inside header set the title enclosed in `<h2>Title</h2>` or any other header level.
* In the tile set the device idx according devices list like `data-device-idx="21"`.

**Content** `index.html`
```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Pico Servo Control</title>
    <!-- Link backward one folder level to reuse your shared global common styles -->
    <link rel="stylesheet" href="../hmitiles.css">
    <script src="../hmitiles.js" defer></script>
</head>
<body>

    <header class="hmi-header-container">
        <div style="display: flex; align-items: center; gap: 15px;">
            <button class="hmi-exit-btn" onclick="goToDomoticzDashboard()">◀ Main Menu</button>
            <h2>Pico Servo Control</h2>
        </div>
    </header>

    <!-- Master panel holding grid matrix rows -->
    <main class="hmi-panel">
        
        <!-- ROW 1 COL 1: TOGGLE CONTROL  -->
        <!-- IDX 21: Links directly to the optimized ServoToggle switch script -->
		<div class="hmi-pack-card" data-type="switch" data-device-idx="21" data-on-text="OPEN" data-off-text="CLOSED">
			<div class="hmi-card-header">
				<div class="hmi-pack-label">Servo Gate Toggle</div>
				<div class="hmi-badge hmi-clickable-badge">CLOSED</div>
			</div>
            <div class="hmi-value-grid">
                <div class="hmi-value-box" style="display: flex; align-items: center; justify-content: center; min-height: 40px;">
                    <div class="hmi-box-data">
                        <span class="hmi-value">OFF</span>
                    </div>
                </div>
            </div>
		</div>

        <!-- ROW 1 COL 2: POSITION SLIDER -->
        <!-- IDX 20: Links directly to the responsive ServoPosition dimmer slider script -->
        <div class="hmi-pack-card" data-type="dimmer" data-device-idx="20" data-on-text="OPEN" data-off-text="CLOSED">
            <div class="hmi-card-header">
                <div class="hmi-pack-label">Servo Positioner</div>
                <div class="hmi-badge hmi-clickable-badge">CLOSED</div>
            </div>
            <div class="hmi-value-grid">
                <div class="hmi-value-box" style="display: flex; align-items: center; justify-content: center; min-height: 40px; padding: 0 8px;">
                    <div class="layout-slider" style="display: flex; align-items: center; gap: 8px; width: 100%;">
                        <input type="range" min="0" max="100" value="0" class="hmi-slider" style="flex: 1;">
                        <div><span class="hmi-dimmer-text">0</span>%</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ROW 1 COL 3: INFO -->
		<!-- IDX 24: Links directly to text info device --->
        <div class="hmi-pack-card" data-type="info" data-device-idx="24">
            <div class="hmi-card-header">
                <!-- Clean, descriptive header label -->
                <div class="hmi-pack-label">Information</div>
                <div class="hmi-badge">INFO</div>
            </div>
            <div class="hmi-value-grid" style="padding: 12px; min-height: 100px;">
                <!-- Multiline text field styled for crisp industrial readability -->
                <div class="hmi-info-text-box" style="font-family: sans-serif; font-size: 12px; line-height: 1.6; color: #444444; text-align: left;">
                    <strong>Servo Angles:</strong><br>
                    <strong>Open:</strong> 90 degrees<br>
                    <strong>Close:</strong> 135 degrees<br>
                    <span style="color: #777777; font-size: 11px; display: block; margin-top: 6px;">
                        Note: Network connection status indicated by green onboard LED.
                    </span>
                </div>
            </div>
        </div>

		<!-- FOOTER -->
		<footer class="hmi-footer-version">
			<span>Domoticz-HMITiles v1.0.0-Beta</span>
		</footer>

    </main>

</body>
</html>
```

## Create Page wrapper (`PicoServoControl.html`)
Inside the folder `www/templates` create file `PicoServoControl.html` which calls the `index.html` located in the Folder
`www/templates/picoservocontrol`.

**Content** `PicoServoControl.html`

```
<script>
  window.location.href = "templates/picoservocontrol/index.html";
</script>
```

## Wire Servo to Pico

```
  Servo  = Pico
- VCC    = Pin 40 (VBUS / 5V)
- GND    = Pin 38 (GND)
- Signal = Pin 6  (GPIO4)
```

## Create Python script (`pico-servo-control.py`)

```
# Imports
import machine
import time
import socket
import network

# Defines various global constants
import config

# Process_Globals
VERSION = "PicoServoControl v20260603"
SERVER_PORT = 80

# Servo configuration
SERVO1_PIN_NR = 4
ANGLE_BASE = 90
ANGLE_OPEN = 90
ANGLE_CLOSE = 135
current_angle = ANGLE_BASE

# Onboard LED - see config.py

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

# Main
def main():
    print("[main]", VERSION)
    
    # Set base position
    set_angle(ANGLE_BASE)
    time.sleep_ms(50)
    print("[main] Init servo angle=", current_angle)
    
    # Connect to WiFi
    if connect_wifi():
        # Initialize TCP Server Socket
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.bind(('', SERVER_PORT))
        server_socket.listen(1)
        print("[main] Done. Listening on port", SERVER_PORT)
        
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
main()
```

## Create Automation Event (`pico_servo_control`)
```
--[[
Listens to switch on/off or slider to set the angle of a servo connected to a Raspberry Pi Pico WH (Pico).
]]--

local IDX_SERVO_SLIDER = 20
local IDX_SERVO_SWITCH = 21

-- Raspberry Pi Pico IP address (no port required as 80 is used)
local URL_SERVER = 'http://192.168.1.115/'
-- Default positions open or close. In addition number 0-100% possible.
local CMD_OPEN = 'open'
local CMD_CLOSE = 'close'
local SHELL_RESPONSE = 'OnPicoServoControlResponse'

local function sendCommand(domoticz, cmd)
    local cmdString = URL_SERVER .. cmd
    
    domoticz.log('Dispatching Wi-Fi action link -> ' .. cmdString, domoticz.LOG_INFO)
    
    -- Use curl -s (silent) and fire it in a safe background thread.
    local networkCommand = "curl -s -m 2 " .. cmdString

    domoticz.executeShellCommand({
        command = networkCommand,
        callback = SHELL_RESPONSE
    })
end

return {
    active = true,
    logging = {
        level = domoticz.LOG_INFO,
        marker = '[PicoServoControl]'
    },
    on = {
        devices = {
            IDX_SERVO_SLIDER, IDX_SERVO_SWITCH
        },
        shellCommandResponses = {
            SHELL_RESPONSE
        },
    },

    execute = function(domoticz, item)

        -- 1. Check if the background execution finished safely
        if (item.isShellCommandResponse) then
            if (item.statusCode == 0) then
                domoticz.log('Wi-Fi command successfully delivered to the server.', domoticz.LOG_INFO)
            else
                domoticz.log('Wi-Fi delivery issue! Linux Status Code: ' .. tostring(item.statusCode), domoticz.LOG_WARNING)
            end
            return 
        end

        -- 2. Handle device changes cleanly
        if (item.isDevice) then
            domoticz.log('Device idx: ' .. item.idx .. ' state: ' .. item.state, domoticz.LOG_INFO)
            
            -- Handle On/Off Switch
            if item.idx == IDX_SERVO_SWITCH then
                if (item.state == 'On') then
                    sendCommand(domoticz, CMD_OPEN)
                    
                    -- Update slider UI to match (Open = 100%) without retriggers
                    -- Force the slider to 100% explicitly
                    domoticz.devices(IDX_SERVO_SLIDER).dimTo(100).silent()
                else
                    sendCommand(domoticz, CMD_CLOSE)
                    -- Setting level to 0 directly turns it off, 
                    domoticz.devices(IDX_SERVO_SLIDER).dimTo(0).silent()
                end
            end                
            
            -- Handle Percentage Slider
            if item.idx == IDX_SERVO_SLIDER then
                -- Target level extraction guarding against 'Off' string state
                local targetLevel = item.level
                if item.state == 'Off' then 
                    targetLevel = 0 
                end
                
                domoticz.log('Slider level parsed: ' .. targetLevel, domoticz.LOG_INFO)
                sendCommand(domoticz, targetLevel)
                
                -- Synchronize the On/Off switch widget UI based on slider position
                if targetLevel > 0 then
                    domoticz.devices(IDX_SERVO_SWITCH).switchOn().silent()
                else
                    domoticz.devices(IDX_SERVO_SWITCH).switchOff().silent()
                end
            end                
        end
    end
}
```


## Run and Test Your Custom Page

1. Start Python script
2. Enable automation Event
2. Refresh the Domoticz Web UI.
3. Goto Tab Custom and select `PicoServoControl'.
4. Control the servo state via UI.

---
