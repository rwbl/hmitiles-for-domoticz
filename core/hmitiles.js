/**
 * @file hmitiles.js
 * @brief Core JavaScript monitoring engine for the Domoticz-HMITiles framework.
 * @project Domoticz-HMITiles
 * @date 2026-06-02
 * @author Robert W.B. Linn (c) 2026 MIT
 * @version 1.0.0-Beta
 * @description Manages industrial-inspired tile updates, trend lines, 
 * network polling, and interactive controls for the Domoticz platform.
 */

// Configuration Setup
const DOMOTICZ_URL = window.parent && window.parent.$ ? window.parent.$.domoticzurl : window.location.origin;

// Set refresh rate to 1 minute (60000) minimum
const REFRESH_RATE = 60000;

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
 * Iterates through the Domoticz device inventory list and routes matching data attributes natively to the UI.
 * @function processDevices
 * @param {Array<Object>} devices - The raw array payload list containing active hardware device properties from the server.
 * @returns {void}
 */
function processDevices(devices) {
    updateCommunicationsStatus(true);

    devices.forEach(device => {
		
		// Get the raw value from property data
		const rawValue = parseFloat(device.Data) || parseFloat(device.Status) || 0; 
        let displayStatus = device.Status || device.Data || "";
		
        // =========================================================================
		// GLOBAL OVERRIDE HOOK = MUST AT VERY TOP OF THE LOOP
        // =========================================================================
        // This lets dedicated pages process data arrays regardless of how elements are configured in HTML!
        // Allow custom pages to intercept the device payload before standard rendering takes place
        if (typeof window.onHMITileProcess === 'function') {
            const interceptResult = window.onHMITileProcess(null, device, rawValue, displayStatus);
            // If the custom page function handles it and returns true, skip generic processing
            if (interceptResult === true) return; 
        }
		
        // Find the tile card matching this specific device index attribute
        const tileElement = document.querySelector(`[data-device-idx="${device.idx}"]`);
        if (!tileElement) return; 

		// Read its custom card type configuration tag
        const cardType = tileElement.getAttribute('data-type') || "standard";

        // =========================================================================
        // GENERIC GLOBAL TEXT INPUT LOGIC PIPELINE
        // =========================================================================
		if (cardType === "text-input") {
			const inputField = tileElement.querySelector('.hmi-text-field');
			const badge = tileElement.querySelector('.hmi-badge');
			
			if (inputField && document.activeElement !== inputField) {
				inputField.value = device.Data || "";
				
				// Return to standard state text if not currently interacting
				if (tileElement.getAttribute('data-alarm') !== "saved") {
					tileElement.removeAttribute('data-alarm');
					if (badge) badge.textContent = "SYNCED";
				}
			}
			
			if (!tileElement.hasAttribute('data-listeners-bound')) {
				tileElement.setAttribute('data-listeners-bound', 'true');
				setupGlobalTextInputListeners(tileElement, device.idx);
			}

			return; // FIXED: Safely exits the loop pass ONLY for text-input cards!
		}
		
        // =========================================================================
        // GENERIC MULTI-VARIABLE COUPLING (Sniffs for sub-element classes inside the card)
        // =========================================================================
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

        // =========================================================================
        // GENERIC PROGRESS BAR & LEVEL GAUGE SYNC
        // =========================================================================
        const barFill = tileElement.querySelector('.hmi-bar-fill');
        const barText = tileElement.querySelector('.hmi-bar-text');
        if (barFill && barText) {
            const numericValue = parseFloat(device.Data) || parseFloat(device.Status) || 0;
            const percentage = Math.min(Math.max(numericValue, 0), 100);
            barFill.style.width = `${percentage}%`;
            barText.textContent = `${Math.round(percentage)}%`;
        }

        // =========================================================================
        // GENERIC GLOBAL SETPOINT STEPPER & PV PIPELINE
        // =========================================================================
        if (cardType === "setpoint-stepper-tile") {
            const spField = tileElement.querySelector('.hmi-sp-value');
            const pvField = tileElement.querySelector('.hmi-pv-value');
            
            const targetPVIdx = tileElement.getAttribute('data-pv-idx');
            const targetUnit = tileElement.getAttribute('data-unit') || "";
            const stepValue = parseFloat(tileElement.getAttribute('data-step') || 0.5);

            // A. Extract and update the target Setpoint value
            const currentSP = parseFloat(device.SetPoint || device.Data || 0);
            if (spField) spField.textContent = `${currentSP.toFixed(1)} ${targetUnit}`;

            // B. Reach across the response array to parse out the live process value (PV)
            if (targetPVIdx) {
                const pvDevice = devices.find(d => String(d.idx) === String(targetPVIdx));
                if (pvDevice && pvField) {
                    const currentPV = parseFloat(pvDevice.Temp || pvDevice.Data || 0);
                    pvField.textContent = `${currentPV.toFixed(1)} ${targetUnit}`;
                }
            }

            // C. Bind interactive step button listeners once on page load initialization
            if (!tileElement.hasAttribute('data-listeners-bound')) {
                tileElement.setAttribute('data-listeners-bound', 'true');
                
                const btnUp = tileElement.querySelector('.hmi-btn-up');
                const btnDown = tileElement.querySelector('.hmi-btn-down');
                
                // Track internal current state target modifications locally
                let workingSP = currentSP;

                const sendSetpointUpdate = async (newVal) => {
                    if (spField) spField.textContent = `${newVal.toFixed(1)} ${targetUnit}`;
                    try {
                        // Standard Domoticz Setpoint Update Command API Endpoint
                        const targetUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=setsetpoint&idx=${device.idx}&setpoint=${newVal.toFixed(1)}`;
                        await fetch(targetUrl);
                    } catch (err) {
                        console.error("Setpoint transmission error:", err);
                    }
                };

                if (btnUp) {
                    btnUp.addEventListener('click', () => {
                        workingSP += stepValue;
                        sendSetpointUpdate(workingSP);
                    });
                }

                if (btnDown) {
                    btnDown.addEventListener('click', () => {
                        workingSP -= stepValue;
                        sendSetpointUpdate(workingSP);
                    });
                }
            }

            // checkAlarmThresholds(device.idx, rawValue);
            return; // Handled completely
        }

        // =========================================================================
		// SETPOINT
        // =========================================================================
        if (device.SetPoint !== undefined) {
            displayStatus = parseFloat(device.SetPoint).toFixed(1);
        }

        // =========================================================================
		// DIMMER SWITCH
        // =========================================================================
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

        // =========================================================================
		// LIGHT/SWITCH, SWITCH, PUMP, VALVE
        // =========================================================================
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

        // =========================================================================
		// ANYOTHER DEVICE
        // =========================================================================
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
		
        // =========================================================================
        // AUTOMATIC ALARM THRESHOLD TRIGGER PIPELINE
        // =========================================================================
        // This fires automatically for EVERY device. If the card contains 
        // data-warn or data-crit attributes, it evaluates them natively!
        checkAlarmThresholds(device.idx, rawValue);
		
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
 * Evaluates live metrics against dynamic boundary levels declared via HTML attributes.
 * @function checkAlarmThresholds
 * @param {number} idx - The unique Domoticz database hardware index identifier code.
 * @param {number} currentValue - The raw numeric value calculation used to determine warning states.
 * @returns {void}
 */
function checkAlarmThresholds(idx, currentValue) {
    const card = document.querySelector(`[data-device-idx="${idx}"]`) || document.getElementById(`idx-${idx}`);
    if (!card) return;

    // 1. Extract data limits from HTML attributes natively
    const critLow = card.getAttribute('data-crit-low');
    const warnLow = card.getAttribute('data-warn-low');
    const critHigh = card.getAttribute('data-crit-high');
    const warnHigh = card.getAttribute('data-warn-high');
    const alertZero = card.getAttribute('data-alert-zero');

    // =========================================================================
    // CRITICAL SHORT-CIRCUIT SAFETY BLOCK
    // =========================================================================
    // If this card is a simple switch or has NO alarms defined, QUIT IMMEDIATELY
    // and do NOT touch the badge text!
    if (critLow === null && warnLow === null && critHigh === null && warnHigh === null && alertZero === null) {
        return; 
    }
    // =========================================================================

    const badge = card.querySelector('.hmi-badge');
    let state = "normal";
    let badgeText = "NORMAL";

    // 2. Run generic boundary check matrix
    if (alertZero === "true" && currentValue === 0) {
        state = "warning";
        badgeText = card.getAttribute('data-zero-text') || "NO PRODUCTION";
    }
    else if (critLow !== null && currentValue <= parseFloat(critLow)) {
        state = "critical";
        badgeText = "CRITICAL";
    } else if (warnLow !== null && currentValue <= parseFloat(warnLow)) {
        state = "warning";
        badgeText = "LOW WARN";
    }
    else if (critHigh !== null && currentValue >= parseFloat(critHigh)) {
        state = "critical";
        badgeText = "CRITICAL";
    } else if (warnHigh !== null && currentValue >= parseFloat(warnHigh)) {
        state = "warning";
        badgeText = "HIGH WARN";
    }

    // 3. Apply output modifications dynamically
    card.setAttribute("data-alarm", state);
    if (badge) badge.textContent = badgeText;
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
 * Global background worker that binds events to any text-input tile automatically
 * @function setupGlobalTextInputListeners
 * @param {object} cardElement - The card element.
 * @param {number} idx - The unique Domoticz database hardware index identifier code.
 * @returns {void}
 */
/**
 * Global background worker that binds events to any text-input tile automatically
 */
function setupGlobalTextInputListeners(cardElement, idx) {
    const inputField = cardElement.querySelector('.hmi-text-field');
    const btnOk = cardElement.querySelector('.hmi-btn-ok');
    const btnCancel = cardElement.querySelector('.hmi-btn-cancel');
    const badge = cardElement.querySelector('.hmi-badge');

    if (!inputField || !btnOk || !btnCancel) return;

    // A. Editing State: Apply data-alarm="editing" to let CSS change colors
    inputField.addEventListener('input', () => {
        cardElement.setAttribute('data-alarm', 'editing');
        if (badge) badge.textContent = "EDITING";
    });

    // B. Cancel Action (Clear attribute to revert to standard dark styling)
    btnCancel.addEventListener('click', () => {
        inputField.blur();
        cardElement.removeAttribute('data-alarm');
        if (badge) badge.textContent = "SYNCED";
        if (typeof fetchDomoticzData === 'function') fetchDomoticzData();
    });

    // C. OK Action: Push payload up and flag state as saved
    btnOk.addEventListener('click', async () => {
        const targetValue = inputField.value;
        inputField.blur();
        
        if (badge) badge.textContent = "SAVING...";

        try {
            const updateUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=udevice&idx=${idx}&nvalue=0&svalue=${encodeURIComponent(targetValue)}`;
            const response = await fetch(updateUrl);
            
            if (response.ok) {
                cardElement.setAttribute('data-alarm', 'saved');
                if (badge) badge.textContent = "SAVED";
                
                if (typeof fetchDomoticzData === 'function') fetchDomoticzData();
            }
        } catch (err) {
            console.error(err);
            if (badge) badge.textContent = "ERR";
        }
    });
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
