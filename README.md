# Domoticz-HMITiles

An open-source HMI (Human Machine Interface) tile layout framework for [Domoticz](http://www.domoticz.com), following widely accepted industrial HMI principles.

This project aims to bring structured, industry-inspired HMI design principles into the Domoticz ecosystem, bridging **Node-RED** (Modbus data fetching), an optimized **dzVents engine script** (safe data parsing), and a **lightweight HTML5/CSS3/JS user interface**.

> 💡 **Related Project:** This repository is the web-based Domoticz implementation of the original [B4X HMITiles Library](https://github.com), extending its core design philosophy into home automation web ecosystems.

---

## 🚀 The HMITiles Ecosystem & Solutions

The **HMITiles** framework is a modular layout solution designed to visualize a wide array of smart home infrastructure. The **Solar Info Dashboard** included in this repository is the first complete, out-of-the-box reference implementation showing how the framework handles active power management and telemetry data. 

**This is an evolving project. More industry-inspired automation solutions (e.g., HVAC management, Tank Monitoring, and Lighting Systems) will follow all along as future expansions.**

---

## ⚡ Quick Start Guide (Get Going in 2 Minutes)

Want to see this project in action immediately? Follow this quick-start loop to deploy a local mockup version:

1. **Download the Repository:** Save the `www/` and `backend/` folders onto your local PC.
2. **Launch a Local View:** Simply double-click the `www/templates/solarinfodashboard/index.html` file inside Windows 11. It will spin up your clean grid matrix right inside your web browser.
3. **Change the Data Hooks:** Open `index.html` in any text editor. Locate the `data-device-idx="NNN"` attribute fields. Swap out those numbers to match any running virtual device numbers inside your active Domoticz system dashboard.
4. **Connect the Engine:** Drop the `SyncSolarMetrics.lua` routine into your Domoticz events script panel, and your dashboard will immediately begin auto-refreshing with your live metrics!

---

## Features
* **Industry-Inspired Design:** Structured, clean tiles focus heavily on situational awareness and clear data hierarchy.
* **Perfect 4x3 Grid Matrix:** Instant layout mapping across all critical solar infrastructure points.
* **Interactive Logger Integration:** Clicking any active tile element instantly targets and opens the native Domoticz device chart log.
* **Asynchronous Manual Updates:** Trigger real-time, ad-hoc server data polls safely with a looping-protected manual switch layout.
* **Dynamic Industrial Alarms:** Live data-alarm attribute injection handles dynamic boundary colors (Warning/Critical) natively.

---

## Screenshots

![Solar Info Dashboard](images/domoticz-hmitiles-solarinfodashboard-1.png "Solar Info Dashboard") 

![Solar Info Dashboard Trends](images/domoticz-hmitiles-solarinfodashboard-2.png "Solar Info Dashboard Trends") 

---

## System Architecture Flow
```text
[Solar Unit Modbus] 
       -> (Reads Raw Registers)
   [Node-RED] --- (Serves CSV via HTTP Endpoint) ---┐
                                                    │
   ┌────────────────────────────────────────────────┘
   ▼
[Domoticz dzVents Script] --- (Parses CSV & Updates Virtual Devices IDX 5-13)
   │
   ▼ (Serves real-time JSON Data)
[HMITiles Front-End Webpage] --- (Renders UI, Live Timestamps & Charts)
```

---

## Folder Structure

```text
Domoticz-HMITiles/
├── LICENSE                    # MIT License file
└── www/
    └── templates/
        ├── hmitiles.css       # Global layout stylesheet file
        ├── hmitiles.js        # Global script engine
        ├── SolarInfoDashboard.html   # Custom Domoticz tab page
        ├── MyNextCustomTemplate.html # Future custom tab page
        └── solarinfodashboard/
            ├── index.html     # Solar layout dashboard file
            ├── trends.html    # Solar native SVG trend file
            └── README.md      # Solar installation documentation file
        └── mynextcustomtemplate/
            ├── index.html     # Solar layout dashboard file
            └── README.md      # Solar installation documentation file
```

--- 

## File Installation Paths

For a standard Domoticz installation, deploy the front-end files into your local web templates directory:

```text
/home/pi/domoticz/www/templates/
├── hmitiles.css
└── hmitiles.js
├── SolarInfoDashboard.html
└── solarinfodashboard/
    ├── index.html
    ├── trends.html
```

### Custom Dashboard Tab Redirect

The `SolarInfoDashboard.html` file acts as your main custom Domoticz tab page. It cleanly routes your session traffic straight into your subfolder assets using a native JavaScript page redirect:

```html
<!-- Inside SolarInfoDashboard.html -->
<script>
  window.location.href = "templates/solarinfodashboard/index.html";
</script>
```

---

## Setup Instructions

### 1. Domoticz Device Configurations
Create the following virtual devices using the **Dummy** hardware type in your Domoticz utility panel:



| IDX | Device Name | Type / SubType | Target Metric Field |
| :--- | :--- | :--- | :--- |
| **5** | `PowerFlowSolar` | Usage, Electric | Solar Production (W) |
| **6** | `SolarDataRequest` | Light/Switch (Push On) | Manual Override Button |
| **7** | `PowerFromGrid` | Usage, Electric | Grid Import Power (W) |
| **8** | `PowerToGrid` | Usage, Electric | Grid Export Power (W) |
| **9** | `PowerToHouse` | Usage, Electric | House Consumption (W) |
| **10** | `PowerToBattery` | Usage, Electric | Battery Charging (W) |
| **11** | `PowerFromBattery` | Usage, Electric | Battery Discharging (W) |
| **12** | `BatteryState` | Percentage | State of Charge (%) |
| **13** | `SolarTimeStamp` | Text | Timestamp last poll / sync |

---

### 2. dzVents Backend Setup
1. In Domoticz, navigate to **Setup -> More Options -> Events**.
2. Create a new **dzVents** script, name it `SolarInfoDashboard`, and paste the following optimized script:

```lua
--[[
Event: SolarInfoDashboard
Brief: Periodically polls the local solar endpoint to extract and update device metrics.
Date: 2026-05-28
]]--

local IDX_MANUAL_BUTTON = 6 
local IDX_POWER_FROM_SOLAR = 5
local IDX_POWER_FROM_GRID = 7
local IDX_POWER_TO_GRID = 8
local IDX_POWER_TO_HOUSE = 9
local IDX_POWER_TO_BATTERY = 10
local IDX_POWER_FROM_BATTERY = 11
local IDX_BATTERY_CHARGE_STATE = 12
local IDX_SOLAR_TIMESTAMP = 13

local URL_SERVER = 'http://homeassistant.local'
local TIMER_INTERVAL = 'every minute'
local HTTP_RESPONSE = 'OnHTTPResponse'

return {
    active = true,
    logging = { level = domoticz.LOG_INFO, marker = '[SolarInfoDashboard]' },
    on = {
        timer = { TIMER_INTERVAL },
        devices = { IDX_MANUAL_BUTTON },
        httpResponses = { HTTP_RESPONSE }
    },
    execute = function(domoticz, item)
        if (item.isHTTPResponse) then
            if (item.ok and item.statusCode == 200) then
                local rawData = item.data  
                if not rawData or rawData == "" then return end

                local function parseData(data)
                    local values = {}
                    for token in string.gmatch(data, "[^,]+") do
                        table.insert(values, tonumber(token) or 0)
                    end
                    return values
                end
                local result = parseData(rawData)

                if #result >= 9 then
                    domoticz.devices(IDX_POWER_FROM_SOLAR).updateEnergy(result)
                    domoticz.devices(IDX_POWER_FROM_GRID).updateEnergy(result)
                    domoticz.devices(IDX_POWER_TO_GRID).updateEnergy(result)
                    domoticz.devices(IDX_POWER_TO_HOUSE).updateEnergy(result)
                    domoticz.devices(IDX_POWER_TO_BATTERY).updateEnergy(result)
                    domoticz.devices(IDX_POWER_FROM_BATTERY).updateEnergy(result)
                    domoticz.devices(IDX_BATTERY_CHARGE_STATE).updatePercentage(result)
                    
                    -- Formats and updates your native text timestamp logger card cleanly
                    local currentClock = os.date("%H:%M:%S")
                    domoticz.devices(IDX_SOLAR_TIMESTAMP).updateText(currentClock)
                end
            end
        else
            if (item.isDevice and item.state == 'On') then
                item.switchOff().afterSec(2).silent() -- Silent prevents infinite loops!
            end
            domoticz.openURL({ url = URL_SERVER, method = 'GET', callback = HTTP_RESPONSE })
        end
    end
}
```

---

### 3. Front-End Deploy
1. Clone this repository to your web directory or host it inside your custom Domoticz directory.
2. Open `hmitiles.js` and point the variable to your local running instance:
```javascript
const DOMOTICZ_URL = window.parent && window.parent.\( ? window.parent.\).domoticzurl : window.location.origin;
```
3. Load up your `index.html` file in any modern web browser to display your plant metrics.

---

## License
This project is licensed under the MIT License - see the LICENSE file for details.

Developed by **Robert W.B. Linn** (c) 2026.
