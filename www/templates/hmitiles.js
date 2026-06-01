/**
 * @file hmitiles.js
 * @brief Core JavaScript monitoring engine for the Domoticz-HMITiles framework.
 * @project Domoticz-HMITiles
 * @date 2026-06-01
 * @author Robert W.B. Linn (c) 2026 MIT
 * @version 1.0.0-Beta
 * @description Manages industrial-inspired tile updates, trend lines, 
 * network polling, and interactive controls for the Domoticz platform.
 */

// Configuration Setup
const DOMOTICZ_URL = window.parent && window.parent.$ ? window.parent.$.domoticzurl : window.location.origin;
const REFRESH_RATE = 5000; 

/**
 * Periodically polls the Domoticz JSON API to fetch real-time device registries.
 * @async
 * @function fetchDomoticzData
 * @returns {Promise<void>}
 */
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

/**
 * Iterates through the device inventory and routes metrics to the UI.
 * @function processDevices
 * @param {Array<Object>} devices - Array of active hardware device properties from the server.
 * @returns {void}
 */
/**
 * Iterates through the Domoticz device inventory list and routes matching data attributes natively to the UI.
 * @function processDevices
 * @param {Array<Object>} devices - The raw array payload list containing active hardware device properties from the server.
 * @returns {void}
 */
function processDevices(devices) {
    updateCommunicationsStatus(true);

    devices.forEach(device => {
        // Find the tile card matching this specific device index attribute
        const tileElement = document.querySelector(`[data-device-idx="${device.idx}"]`);
        if (!tileElement) return; 

        // GENERIC MULTI-VARIABLE COUPLING (Sniffs for sub-element classes inside the card)
        const tempEl = tileElement.querySelector('.hmi-value-temp');
        const humEl = tileElement.querySelector('.hmi-value-hum');
        const baroEl = tileElement.querySelector('.hmi-value-baro');

        if (tempEl || humEl || baroEl) {
            // If the element fields exist, parse out Domoticz sub-properties natively
            if (tempEl && device.Temp !== undefined) tempEl.textContent = `${parseFloat(device.Temp).toFixed(1)} °C`;
            if (humEl && device.Humidity !== undefined) humEl.textContent = `${device.Humidity} %`;
            if (baroEl && device.Barometer !== undefined) baroEl.textContent = `${device.Barometer} hPa`;
            return; // Move to the next device immediately
        }

        // GENERIC PROGRESS BAR & LEVEL GAUGE SYNC
        const barFill = tileElement.querySelector('.hmi-bar-fill');
        const barText = tileElement.querySelector('.hmi-bar-text');
        if (barFill && barText) {
            const numericValue = parseFloat(device.Data) || parseFloat(device.Status) || 0;
            const percentage = Math.min(Math.max(numericValue, 0), 100);
            barFill.style.width = `${percentage}%`;
            barText.textContent = `${Math.round(percentage)}%`;
        }

        // GENERIC HARDWARE STATE ENGINE (Switches, Thermostats, Dimmers, and Standard Values)
        const rawValue = parseFloat(device.Data) || parseFloat(device.Status) || 0; 
        let displayStatus = "";
        const cardType = tileElement.getAttribute('data-type') || "standard";

		// SETPOINT
        if (device.SetPoint !== undefined) {
            displayStatus = parseFloat(device.SetPoint).toFixed(1);
        }

		// DIMMER SWITCH
        else if (device.SwitchType === "Dimmer" || device.SwitchTypeVal === 7) {
            const slider = tileElement.querySelector('.hmi-slider');
            const dimmerText = tileElement.querySelector('.hmi-dimmer-text');

            // GENERIC TEXT TRANSLATION ENGINE
            const customOnText = tileElement.getAttribute('data-on-text');
            const customOffText = tileElement.getAttribute('data-off-text');

			// EXTRACT CORE STATUS INFORMATION
            const rawStatus = String(device.Status || device.Data || "").toUpperCase();
            const isDeviceOff = (rawStatus === "OFF");
            
            // FORCE LEVEL CORRECTION (If Domoticz says OFF, level is 0)
            let currentLevel = parseInt(device.Level, 10) || 0;
            if (isDeviceOff) {
                currentLevel = 0;
            }

            // UPDATE SLIDER INTERFACE (Only if user isn't actively clicking/dragging)
            if (slider && document.activeElement !== slider) {
                slider.value = currentLevel;
            }
            if (dimmerText) {
                dimmerText.textContent = currentLevel;
            }

            // MAP FALLBACK TEXT DISPLAY FOR THE CORE RENDERER
            displayStatus = rawStatus;
            if (rawStatus !== "ON" && rawStatus !== "OFF") {
                displayStatus = "ON";
            }
            if (dimmerText) dimmerText.textContent = currentLevel;	// device.Level;

            // SET LEVEL TEXT IF LEVEL GREATER 0 to OPEN/CLOSED
            if (currentLevel > 0) {
                displayStatus = customOnText ? customOnText : (device.Status || device.Data || "OPEN");
            } else {
                displayStatus = customOffText ? customOffText : (device.Status || device.Data || "CLOSED");
            }
        }

		// LIGHT/SWITCH, SWITCH, PUMP, VALVE
        else if (device.Type === "Light/Switch" || cardType === "switch" || cardType === "pump" || cardType === "valve") {
            const rawStatus = String(device.Status || device.Data || "").toUpperCase();
            const isRawOn = (rawStatus === "ON" || rawStatus === "TRUE");

            // GENERIC TEXT TRANSLATION ENGINE
            const customOnText = tileElement.getAttribute('data-on-text');
            const customOffText = tileElement.getAttribute('data-off-text');

            if (isRawOn) {
                // Use custom HTML text, otherwise fall back to native Domoticz text
                displayStatus = customOnText ? customOnText : (device.Status || device.Data || "ON");
            } else {
                // Use custom HTML text, otherwise fall back to native Domoticz text
                displayStatus = customOffText ? customOffText : (device.Status || device.Data || "OFF");
            }
        }

		// ANYOTHER DEVICE
        else {
            displayStatus = device.Status || device.Data || "";
        }

        // Send out to core display text box renderer
        updateHMIAnalogTile(tileElement, {
            name: device.Name,
            value: rawValue,
            status: displayStatus,
            lastUpdate: device.LastUpdate
        });
    });
}

/**
 * Updates text elements and gauge bars within a specified panel card.
 * @function updateHMIAnalogTile
 * @param {HTMLElement} element - The target tile container module block element.
 * @param {Object} data - Processed visual tracking property dataset package.
 * @param {string} data.status - The clean string text formatted for status badges.
 * @param {number} data.value - The raw numeric value floating-point calculation.
 * @returns {void}
 */
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

/**
 * Toggles a global CSS flag modification on the webpage layout body tag if background communications fail.
 * @function updateCommunicationsStatus
 * @param {boolean} isOnline - Set to true if server answers safely, false if data drops.
 * @returns {void}
 */
function updateCommunicationsStatus(isOnline) {
    document.body.classList.toggle('hmi-comms-lost', !isOnline);
}

/**
 * Registers global event routing handlers to bind click, input, and sliding actions.
 * @function setupControlListeners
 * @returns {void}
 */
function setupControlListeners() {
    
    // CLICK ACTIONS (Switches, Badges, Up/Down Thermostat buttons, and Graphs)
    document.body.addEventListener('click', async function(event) {
        
        // HANDLE BADGE CLICK ACTIONS (Switches, Pumps, Valves)
        const badge = event.target.closest('.hmi-clickable-badge');
        if (badge) {
            const card = badge.closest('.hmi-pack-card');
            if (!card) return;

			const idx = parseInt(card.getAttribute('data-device-idx'), 10);
            const currentStatus = badge.textContent.trim().toUpperCase();
            const isCurrentlyOn = (currentStatus === "ON" || currentStatus === "RUNNING" || currentStatus === "OPEN" || (parseInt(currentStatus, 10) > 0));
            const targetCommand = isCurrentlyOn ? "Turn Off" : "Turn On";

			console.log("DEBUG CARD ELEMENT:", card);
            console.log(`SCADA Execution -> IDX ${idx}: Sending -> ${targetCommand}`);
            await sendDomoticzSwitchCommand(idx, targetCommand);
            return; 
        }

        // HANDLE THERMOSTAT UP/DOWN BUTTON CLICKS
        const tempBtn = event.target.closest('.hmi-temp-btn');
        if (tempBtn) {
            const card = tempBtn.closest('.hmi-pack-card');
            if (!card) return;

            const idx = parseInt(card.getAttribute('data-device-idx'), 10);
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

        // HANDLE CLICKING THE CARD TO OPEN CHARTS
        const clickableCard = event.target.closest('.hmi-clickable-card');
        if (clickableCard) {
            const idx = clickableCard.getAttribute('data-device-idx');
            if (idx) {
                // Call domoticz existing graph opening function
                openDomoticzChart(idx);
                return;
            }
        }
    });

    // SLIDER MOVING ACTION (Real-time numbers while dragging)
    document.body.addEventListener('input', function(event) {
        const slider = event.target.closest('.hmi-slider');
        if (!slider) return;

        slider.isDragging = true; 
        const card = slider.closest('.hmi-pack-card');
        if (!card) return;

        const dimmerText = card.querySelector('.hmi-dimmer-text');
        if (dimmerText) {
            dimmerText.textContent = slider.value;
        }
    });
	
    // SLIDER RELEASED ACTION (Fires command link to network)
    document.body.addEventListener('change', async function(event) {
        const slider = event.target.closest('.hmi-slider');
        if (!slider) return;

        slider.isDragging = false; 
        const card = slider.closest('.hmi-pack-card');
        if (!card) return;

        const idx = parseInt(card.getAttribute('data-device-idx'), 10);
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
}

/**
 * Dispatches an asynchronous switch execution command link to the network.
 * @async
 * @function sendDomoticzSwitchCommand
 * @param {number} idx - The unique Domoticz database hardware index identifier code.
 * @param {string} command - The target action string (e.g., "Turn On", "Turn Off").
 * @returns {Promise<void>}
 */
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

/**
 * Dispatches an asynchronous temperature setpoint modification command to the Domoticz server.
 * @async
 * @function sendDomoticzSetpointCommand
 * @param {number} idx - The unique Domoticz database hardware index identifier code.
 * @param {string|number} targetTemperature - The target thermostat temperature value (e.g., 21.5).
 * @returns {Promise<void>}
 */
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

/**
 * Launches the native Domoticz history chart telemetry panel page inside a fresh browser navigation tab.
 * @function openDomoticzChart
 * @param {string|number} idx - The unique Domoticz database hardware index identifier code.
 * @returns {void}
 */
function openDomoticzChart(idx) {
    const logUrl = `${DOMOTICZ_URL}/#/Devices/${idx}/Log`;
    window.open(logUrl, '_blank'); // Opens chart in a new browser tab
}

/**
 * Captures the current system time and updates the visible header container timestamp placeholder block.
 * @function updateDashboardTimestamp
 * @returns {void}
 */
function updateDashboardTimestamp() {
    const now = new Date();
    const timeString = now.toLocaleTimeString(); // Format HH:MM:SS
    document.getElementById("hmi-last-update").innerText = timeString;
}

/**
 * Evaluates live metrics against defined boundary levels and injects matching data-alarm states natively.
 * @function checkAlarmThresholds
 * @param {number} idx - The unique Domoticz database hardware index identifier code.
 * @param {number} currentValue - The raw numeric value calculation used to determine warning states.
 * @returns {void}
 */
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

/**
 * Handles the visual toggle state execution cycle and cool-down timer for your manual override data button.
 * @function toggleManualRequest
 * @returns {void}
 */
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
 * Redirects the browser viewport straight to the native Domoticz root control panel menu.
 * @function goToDomoticzDashboard
 * @returns {void}
 */
function goToDomoticzDashboard() {
    console.log("SCADA Navigation -> Shifting viewport window back to main Domoticz desk.");
    
    // Directs the top-level frame layer window path to load the native dashboard
    window.top.location.href = `${DOMOTICZ_URL}/`;
}

/**
 * Global initialization handler to bind control listeners and kickstart background network polling cycles.
 * @listens DOMContentLoaded
 */
window.addEventListener('DOMContentLoaded', () => {
    fetchDomoticzData();
    setInterval(fetchDomoticzData, REFRESH_RATE);
    setupControlListeners();
});
