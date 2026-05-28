// hmitiles.js

// --- CONFIGURATION ---
// Configuration Setup
const DOMOTICZ_URL = window.parent && window.parent.$ ? window.parent.$.domoticzurl : window.location.origin;
const REFRESH_RATE = 5000; 

// --- DATA FETCHING (HTTP POLLING) ---
async function fetchDomoticzData() {
    try {
        const response = await fetch(`${DOMOTICZ_URL}/json.htm?type=command&param=getdevices&filter=all`);
        if (!response.ok) throw new Error(`Network response error: ${response.status}`);
        
        const data = await response.json();
        if (data.result) {
            processDevices(data.result);
        }
    } catch (error) {
        console.error("HMITiles Fetch Error:", error);
        updateCommunicationsStatus(false);
    }
}

// --- DATA PROCESSING CORE ---
function processDevices(devices) {
    updateCommunicationsStatus(true);

    devices.forEach(device => {
        const tileElement = document.getElementById(`idx-${device.idx}`);
        if (!tileElement) return; 

        const rawValue = parseFloat(device.Data) || parseFloat(device.Status) || 0; 
        let displayStatus = "";

        // Read the custom data-type attribute from your HTML file if it exists
        const cardType = tileElement.getAttribute('data-type') || "standard";

        // --- TYPE 1: THERMOSTAT / SETPOINT ---
        if (device.SetPoint !== undefined) {
            displayStatus = parseFloat(device.SetPoint).toFixed(1);
        }
        
        // --- TYPE 2: DIMMER SWITCHES (STRICTLY SEPARATED) ---
        else if (device.SwitchType === "Dimmer" || device.SwitchTypeVal === 7) {
            const slider = tileElement.querySelector('.hmi-slider');
            const dimmerText = tileElement.querySelector('.hmi-dimmer-text');
            
            // Sync the physical slider knob position
            if (slider && document.activeElement !== slider) {
                slider.value = device.Level;
            }
            // Sync the text field level percentage number
            if (dimmerText) {
                dimmerText.textContent = device.Level;
            }
            
            // For dimmers, we pass the raw level number to the final display container
            displayStatus = device.Level; 
        }
        
        // --- TYPE 3: STANDARD ON/OFF TOGGLE SWITCHES (STRICTLY SEPARATED) ---
        else if (device.Type === "Light/Switch" || cardType === "switch" || cardType === "pump" || cardType === "valve") {
            const rawStatus = String(device.Status || device.Data || "").toUpperCase();
            const isRawOn = (rawStatus === "ON" || rawStatus === "TRUE");

            // Map the text values purely on the custom attribute wording rules
            if (cardType === "pump") {
                displayStatus = isRawOn ? "RUNNING" : "STOPPED";
            } else if (cardType === "valve") {
                displayStatus = isRawOn ? "OPEN" : "CLOSED";
            } else {
                displayStatus = isRawOn ? "ON" : "OFF"; // Perfect fallback for old On/Off switches
            }
        }
        
        // --- TYPE 4: ANALOG PROCESS VALUE SENSORS (Tanks, Gauges, Pressure) ---
        else {
            displayStatus = device.Status || device.Data || "";
        }

        // --- SEND CLEAN DATA TO UI RE-RENDER ---
        updateHMIAnalogTile(tileElement, {
            name: device.Name,
            value: rawValue,
            unit: device.Data ? device.Data.replace(/[0-9.,\s]/g, '') : '', 
            status: displayStatus,
            lastUpdate: device.LastUpdate
        });
    });
}

// --- UI COMPONENT RENDERING ---
function updateHMIAnalogTile(element, data) {
    const valueField = element.querySelector('.hmi-value');
    if (valueField) {
        valueField.textContent = data.status; 
    }

    const statusBadge = element.querySelector('.hmi-clickable-badge');
    if (statusBadge) {
        statusBadge.textContent = String(data.status).toUpperCase();
    }
    
    const barFill = element.querySelector('.hmi-bar-fill');
    const barText = element.querySelector('.hmi-bar-text');
    const numericValue = parseFloat(data.value) || 0;
    
    if (barFill && barText) {
        const percentage = Math.min(Math.max(numericValue, 0), 100);
        barFill.style.width = `${percentage}%`;
        barText.textContent = `${Math.round(percentage)}%`;
    }
}

function updateCommunicationsStatus(isOnline) {
    document.body.classList.toggle('hmi-comms-lost', !isOnline);
}

// --- INTERACTIVE COMMAND HANDLING ---
function setupControlListeners() {
    
    // 1. CLICK ACTIONS (Switches, Badges, Up/Down Thermostat buttons)
    document.body.addEventListener('click', async function(event) {
        
        // HANDLE BADGE CLICK ACTIONS (Switches, Pumps, Valves)
        const badge = event.target.closest('.hmi-clickable-badge');
        if (badge) {
            const card = badge.closest('.hmi-pack-card');
            if (!card) return;

            const idx = parseInt(card.id.replace('idx-', ''), 10);
            const currentStatus = badge.textContent.trim().toUpperCase();
            
            // Check if the current visible text state is active
            const isCurrentlyOn = (currentStatus === "ON" || currentStatus === "RUNNING" || currentStatus === "OPEN" || (parseInt(currentStatus, 10) > 0));
            const targetCommand = isCurrentlyOn ? "Turn Off" : "Turn On";

            console.log(`SCADA Execution -> IDX ${idx}: Sending -> ${targetCommand}`);
            await sendDomoticzSwitchCommand(idx, targetCommand);
            return; 
        }

        // HANDLE THERMOSTAT UP/DOWN BUTTON CLICKS
        const tempBtn = event.target.closest('.hmi-temp-btn');
        if (tempBtn) {
            const card = tempBtn.closest('.hmi-pack-card');
            if (!card) return;

            const idx = parseInt(card.id.replace('idx-', ''), 10);
            const valueField = card.querySelector('.hmi-value');
            if (!valueField) return;

            let currentTemp = parseFloat(valueField.textContent) || 20.0;
            const isUpClick = tempBtn.classList.contains('btn-up');
            let newTemp = isUpClick ? currentTemp + 0.5 : currentTemp - 0.5;
            
            newTemp = newTemp.toFixed(1);
            valueField.textContent = newTemp;

            console.log(`Setting Thermostat IDX ${idx} -> ${newTemp}°C`);
            await sendDomoticzSetpointCommand(idx, newTemp);
            return;
        }
    });

    // 2. SLIDER MOVING ACTION (Real-time numbers while dragging)
    // A. FLAG ON: User touches and begins moving the slider handle knob
    document.body.addEventListener('input', function(event) {
        const slider = event.target.closest('.hmi-slider');
        if (!slider) return;

        slider.isDragging = true; // Tell the system to temporarily pause remote background updates

        const card = slider.closest('.hmi-pack-card');
        if (!card) return;

        const dimmerText = card.querySelector('.hmi-dimmer-text');
        if (dimmerText) {
            dimmerText.textContent = slider.value;
        }
    });
	/*
	document.body.addEventListener('input', function(event) {
        const slider = event.target.closest('.hmi-slider');
        if (!slider) return;

        const card = slider.closest('.hmi-pack-card');
        if (!card) return;

        const dimmerText = card.querySelector('.hmi-dimmer-text');
        if (dimmerText) {
            dimmerText.textContent = slider.value;
        }
    });
	*/
	
    // 3. SLIDER RELEASED ACTION (Fires command link to network)
	// B. FLAG OFF & COMMAND DISPATCH: User lets go of the mouse button
    document.body.addEventListener('change', async function(event) {
        const slider = event.target.closest('.hmi-slider');
        if (!slider) return;

        slider.isDragging = false; // Unlocks the handle so background updates from Domoticz can move it again

        const card = slider.closest('.hmi-pack-card');
        if (!card) return;

        const idx = parseInt(card.id.replace('idx-', ''), 10);
        const targetLevel = slider.value;

        console.log(`Dimmer Hardware Action -> Setting IDX ${idx} -> ${targetLevel}%`);
        
        const switchCmd = (targetLevel == 0) ? "Off" : "Set%20Level";
        const commandUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=switchlight&idx=${idx}&switchcmd=${switchCmd}&level=${targetLevel}`;

        try {
            const response = await fetch(commandUrl);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const result = await response.json();
            if (result.status === "OK") {
                setTimeout(fetchDomoticzData, 400);
            }
        } catch (error) {
            console.error(`Failed to dispatch dimmer execution:`, error);
        }
    });	
	/*
    document.body.addEventListener('change', async function(event) {
        const slider = event.target.closest('.hmi-slider');
        if (!slider) return;

        const card = slider.closest('.hmi-pack-card');
        if (!card) return;

        const idx = parseInt(card.id.replace('idx-', ''), 10);
        const targetLevel = slider.value;

        console.log(`Dimmer Hardware Action -> Setting IDX ${idx} -> ${targetLevel}%`);
        
        const switchCmd = (targetLevel == 0) ? "Off" : "Set%20Level";
        const commandUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=switchlight&idx=${idx}&switchcmd=${switchCmd}&level=${targetLevel}`;

        try {
            const response = await fetch(commandUrl);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const result = await response.json();
            if (result.status === "OK") {
                setTimeout(fetchDomoticzData, 400);
            }
        } catch (error) {
            console.error(`Failed to dispatch dimmer execution:`, error);
        }
    });
	*/
}

// Command execution dispatcher for standard toggle switches
async function sendDomoticzSwitchCommand(idx, command) {
    const switchCmdValue = (command === "Turn On") ? "On" : "Off";
    const commandUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=switchlight&idx=${idx}&switchcmd=${switchCmdValue}&level=0`;

    try {
        const response = await fetch(commandUrl);
        if (!response.ok) throw new Error(`HTTP request failed: ${response.status}`);
        const result = await response.json();
        if (result.status === "OK") {
            setTimeout(fetchDomoticzData, 300);
        }
    } catch (error) {
        console.error(`Failed to dispatch switch execution:`, error);
    }
}

// Command execution dispatcher for thermostats
async function sendDomoticzSetpointCommand(idx, targetTemperature) {
    const commandUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=setsetpoint&idx=${idx}&setpoint=${targetTemperature}`;

    try {
        const response = await fetch(commandUrl);
        if (!response.ok) throw new Error(`HTTP request failed`);
        const result = await response.json();
        if (result.status === "OK") {
            setTimeout(fetchDomoticzData, 500);
        }
    } catch (error) {
        console.error(`Failed to dispatch thermostat execution:`, error);
    }
}

// 1. Click on card to open Domoticz Device Chart Log
function openDomoticzChart(idx) {
    const logUrl = `${DOMOTICZ_URL}/#/Devices/${idx}/Log`;
    window.open(logUrl, '_blank'); // Opens your chart in a new browser tab
}

// 2. Set Timestamp of Last Data Update
function updateDashboardTimestamp() {
    const now = new Date();
    const timeString = now.toLocaleTimeString(); // Formats nicely as HH:MM:SS
    document.getElementById("hmi-last-update").innerText = timeString;
}

// 3. Process Industrial Alarm Threshold States
function checkAlarmThresholds(idx, currentValue) {
    const card = document.getElementById(`idx-${idx}`);
    if (!card) return;

    const badge = card.querySelector('.hmi-badge');
    let state = "normal";
    let badgeText = "NORMAL";

    // Example logic for Battery Level (IDX 12)
    if (idx === 12) {
        if (currentValue <= 10) {
            state = "critical"; // Triggers CSS red background
            badgeText = "CRITICAL";
        } else if (currentValue <= 20) {
            state = "warning";  // Triggers CSS amber background
            badgeText = "LOW WARN";
        }
    }
    
    // Example logic for Solar Power Drops (IDX 5)
    if (idx === 5) {
        if (currentValue === 0) {
            state = "warning";
            badgeText = "NO PRODUCTION";
        }
    }

    // Apply attribute modifications to let CSS change colors dynamically
    card.setAttribute("data-alarm", state);
    if (badge) badge.innerText = badgeText;
}

// Example Manual Request trigger execution simulation
function toggleManualRequest() {
    const btnText = document.getElementById("btn-text-6");
    const btnBadge = document.getElementById("btn-badge-6");
    
    btnText.innerText = "ON";
    btnBadge.innerText = "ON";
    
    // Here you would add your node-red http fetch request call!
    console.log("Requesting data from Domoticz device IDX 6...");
    
    // Auto reset visual toggle state mirroring the dzVents script logic
    setTimeout(() => {
        btnText.innerText = "OFF";
        btnBadge.innerText = "OFF";
        updateDashboardTimestamp(); // Refresh stamp on successful run completion
    }, 2000);
}

/**
 * Redirects the active window viewport session back to the native Domoticz home landing tab
 */
function goToDomoticzDashboard() {
    console.log("SCADA Navigation -> Shifting viewport window back to main Domoticz desk.");
    
    // Directs the top-level frame layer window path to load the native dashboard
    window.top.location.href = `${DOMOTICZ_URL}/`;
}

// --- UNIFIED INITIALIZATION ROUTINE ---
window.addEventListener('DOMContentLoaded', () => {
    fetchDomoticzData();
    setInterval(fetchDomoticzData, REFRESH_RATE);
    setupControlListeners();
});
