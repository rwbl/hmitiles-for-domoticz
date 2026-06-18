/**
 * @file hmitiles.js
 * @brief Core JavaScript monitoring engine for the Domoticz-HMITiles framework.
 * @project Domoticz-HMITiles
 * @date 2026-06-18
 * @author Robert W.B. Linn (c) 2026 MIT
 * @version 1.0.0-Beta
 * @description Manages industrial-inspired tile updates, trend lines, 
 * network polling, and interactive controls for the Domoticz platform.
 */

// GLOBAL CONFIGURATION SETTINGS
const DEBUG = false; // Set to true to see logs in console, false to hide them

// Domoticz server URL
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
		const commandUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=getdevices&filter=all`;
		if (DEBUG) console.log("fetchDomoticzData", commandUrl);
		
        const response = await fetch(commandUrl);
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

	// Loop over all devices
    devices.forEach(device => {
		
		if (DEBUG) console.log("processDevices idx data type", device.idx, device.Data, device.Type);

		// Get the raw value from property device.Data
		let rawValue = device.Data; 
		
		// Init display status
        let displayStatus = device.Data || "";
		
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

		// =========================================================================
        // MULTI-TILE INSTANCE TARGET ROUTING ENGINE
        // =========================================================================
        // Locate EVERY tile card container instance matching this specific device index
        const matchingTiles = document.querySelectorAll(`[data-device-idx="${device.idx}"]`);
        
		// Move to next device in your array if no HTML tile matches
		if (matchingTiles.length === 0) return;

        // Iterate through each matching tile instance independently
        matchingTiles.forEach(tileElement => {

			// Read its custom card type configuration tag
			const cardType = tileElement.getAttribute('data-type') || "standard";

			if (DEBUG) console.log("processDevices idx=", device.idx, "cardType=", cardType);

			// =========================================================================
			// PROCESS TIMESTAMP FIRST
			// =========================================================================
			// This executes before any tile-specific 'return' statements can intercept it
			const lastUpdateContainer = tileElement.querySelector('.hmi-last-update');

			if (lastUpdateContainer && device.LastUpdate) {
				const lastUpdateField = lastUpdateContainer.querySelector('.hmi-value-update');
				if (lastUpdateField) {
					lastUpdateField.textContent = device.LastUpdate;
				}
			}

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

				return; // Safely exits the loop pass ONLY for text-input cards!
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
			if (cardType === "progress-bar-tile") {
				const barContainer = tileElement.querySelector('.hmi-bar-container');
				const barFill = tileElement.querySelector('.hmi-bar-fill');
				if (barContainer) {
					// Extract only the sequential numeric digits (\d+) from the text string
					const match = rawValue.match(/\d+/);
					// If digits are found, parse them to a base-10 integer; otherwise fallback to 0
					rawValue = match ? parseInt(match[0], 10) : 0;
					displayStatus = rawValue;
				}
				if (barFill) {
					const percentage = Math.min(Math.max(rawValue, 0), 100);
					barFill.style.width = `${percentage}%`;
					// device.Data = percentage;
				}
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

				// Extract and update the target Setpoint value
				const currentSP = parseFloat(device.SetPoint || 0);
				if (spField) spField.textContent = `${currentSP.toFixed(1)} ${targetUnit}`;

				// Reach across the response array to parse out the live process value (PV)
				if (targetPVIdx) {
					const pvDevice = devices.find(d => String(d.idx) === String(targetPVIdx));
					if (pvDevice && pvField) {
						const currentPV = parseFloat(pvDevice.Temp || pvDevice.Data || 0);
						pvField.textContent = `${currentPV.toFixed(1)} ${targetUnit}`;
					}
				}

				// Bind interactive step button listeners once on page load initialization
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

				// return; // Handled completely
			}

			// =========================================================================
			// SETPOINT
			// =========================================================================
			if (device.SetPoint !== undefined) {
				displayStatus = parseFloat(device.SetPoint).toFixed(1);
			}

			// =========================================================================
			// LIGHT/SWITCH, SELECTOR SWITCH
			// =========================================================================
			if (device.SwitchType === "Selector" || cardType === "selector") {
				const dropdownElement = tileElement.querySelector('.hmi-selector-dropdown');
				if (dropdownElement) {
					// Domoticz typically exposes this via device.Level or device.LevelInt
					const currentLevel = device.Level !== undefined ? device.Level : device.LevelInt;
					if (currentLevel !== undefined) {
						dropdownElement.value = currentLevel;
					}
				}

				// Tell the card to act like it has "static" text behavior.
				// This prevents updateHMIAnalogTile from failing when it looks for valueField!
				const valueField = tileElement.querySelector('.hmi-value');
				if (!valueField) {
					tileElement.setAttribute('data-text', 'static');
				}
			}

			// =========================================================================
			// DIMMER SWITCH
			// =========================================================================
			if (device.SwitchType === "Dimmer" || device.SwitchTypeVal === 7) {
				const slider = tileElement.querySelector('.hmi-slider');
				const dimmerText = tileElement.querySelector('.hmi-dimmer-text');

				// GENERIC TEXT TRANSLATION ENGINE
				const customOnText = tileElement.getAttribute('data-on-text');
				const customOffText = tileElement.getAttribute('data-off-text');

				// EXTRACT CORE STATUS INFORMATION
				const rawStatus = String(rawValue || "").toUpperCase();
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
					displayStatus = customOnText ? customOnText : (device.Data || "OPEN");
				} else {
					displayStatus = customOffText ? customOffText : (device.Data || "CLOSED");
				}
			}

			// =========================================================================
			// LIGHT/SWITCH, SWITCH
			// =========================================================================
			if (device.Type === "Light/Switch" || cardType === "switch") {
				const rawStatus = String(rawValue || "").toUpperCase();
				const isRawOn = (rawStatus === "ON" || rawStatus === "TRUE");

				// GENERIC TEXT TRANSLATION ENGINE
				const customOnText = tileElement.getAttribute('data-on-text');
				const customOffText = tileElement.getAttribute('data-off-text');

				if (isRawOn) {
					// Use custom HTML text, otherwise fall back to native Domoticz text
					displayStatus = customOnText ? customOnText : (device.Data || "ON");
				} else {
					// Use custom HTML text, otherwise fall back to native Domoticz text
					displayStatus = customOffText ? customOffText : (device.Data || "OFF");
				}
				
				// Set rawValue used by checkAlarmThresholds
				rawValue = isRawOn ? 1 : 0;
			}

			// =========================================================================
			// WIND (Standalone Component)
			// =========================================================================
			if (device.Type === 'Wind') {
				// Fallback to zero string if device data string is empty
				rawValue = device.Data || "0;N;0;0;0;0";
				// Core engine handler update
				updateWindTile(tileElement, rawValue, device.Name);
				// Handled completely because HMI is updated using updateWindTile
				return; 
			}

			// =========================================================================
			// AIR QUALITY
			// =========================================================================
			if (device.Type === 'Air Quality') {
				// Fallback to 0 value if device data string is empty
				rawValue = parseInt(device.Data, 10) || 0;
				displayStatus = `${rawValue} PPM`;
			}

			// =========================================================================
			// ANYOTHER DEVICE
			// =========================================================================
			if (!displayStatus) {
				displayStatus = rawValue || "";
			}

			console.log("processDevices idx=", device.idx, "name=", device.Name, "value=", rawValue, "status=", displayStatus, "lastUpdate=", device.LastUpdate);

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
            // Extract the operational threshold direction type directly from the HTML card wrapper
            const alarmType = tileElement.getAttribute('data-alarm-type');
            // Secure Rule: ONLY process thresholds if the user explicitly requested "up" or "down" calculations
            if (alarmType === "up" || alarmType === "down") {
                checkAlarmThresholds(device.idx, rawValue);
            }

		}); // This closing brace seals the multi-tile .forEach loop blocks securely!
    }); // This is your existing device array loop ending bracket
}

function checkAlarmThresholds(idx, currentValue) {
    const card = document.querySelector(`[data-device-idx="${idx}"]`) || document.getElementById(`idx-${idx}`);
    if (!card) return;

    const alarmType = card.getAttribute('data-alarm-type') || "up";
    const badge = card.querySelector('.hmi-badge');
    const val = parseFloat(currentValue);

    // Dynamic extraction: reads both text strings and alarm states from HTML attributes
    const thresholds = [
        { lvl: card.getAttribute('data-level-critical'), txt: card.getAttribute('data-text-critical'), state: card.getAttribute('data-state-critical') || "critical" },
        { lvl: card.getAttribute('data-level-high'),     txt: card.getAttribute('data-text-high'),     state: card.getAttribute('data-state-high') || "normal" },
        { lvl: card.getAttribute('data-level-medium'),   txt: card.getAttribute('data-text-medium'),   state: card.getAttribute('data-state-medium') || "normal" },
        { lvl: card.getAttribute('data-level-low'),      txt: card.getAttribute('data-text-low'),      state: card.getAttribute('data-state-low') || "warning" },
        { lvl: card.getAttribute('data-level-info'),     txt: card.getAttribute('data-text-info'),     state: card.getAttribute('data-state-info') || "warning" }
    ];

    let matchedState = "normal";
    let matchedText = card.getAttribute('data-text-normal') || "NORMAL";

    if (alarmType === "up") {
        const activeTiers = thresholds.filter(t => t.lvl !== null).sort((a, b) => parseFloat(b.lvl) - parseFloat(a.lvl));
        for (const tier of activeTiers) {
            if (val >= parseFloat(tier.lvl)) {
                matchedState = tier.state;
                matchedText = tier.txt || "ALERT";
                break;
            }
        }
    } else if (alarmType === "down") {
        const activeTiers = thresholds.filter(t => t.lvl !== null).sort((a, b) => parseFloat(a.lvl) - parseFloat(b.lvl));
        for (const tier of activeTiers) {
            if (val <= parseFloat(tier.lvl)) {
                matchedState = tier.state;
                matchedText = tier.txt || "ALERT";
                break;
            }
        }
    }

    // Apply exact classes dynamically
    card.setAttribute("data-alarm", matchedState);
    if (badge) {
        badge.textContent = matchedText.toUpperCase();
        badge.className = "hmi-badge hmi-clickable-badge";
        
        if (matchedState === "critical") {
            badge.classList.add("hmi-alarm-state");
        } else if (matchedState === "warning") {
            badge.classList.add("hmi-warning-state");
        }
    }
}

/**
 * Processes, parses, and updates a standalone Wind Environment Station tile component
 * @param {HTMLElement} card - The individual .hmi-pack-card element
 * @param {string} svalue - Semicolon separated raw values: WB;WD;WS;WG;22;24
 * @param {string} deviceName - The name of the device from Domoticz
 */
function updateWindTile(card, svalue, deviceName) {
    if (!card) {
        console.error("❌ CRITICAL: Target 'card' DOM element node is null or invalid!");
        return;
    }
    if (!svalue) {
        console.error("❌ CRITICAL: Incoming data payload 'svalue' is empty or undefined!");
        return;
    }

    // Split raw text segments cleanly into a standard array data list
    const windParts = svalue.split(';');

    if (windParts.length < 4) {
        console.error("❌ CRITICAL: Data verification failed. Payload contains less than 4 blocks.");
        return;
    }

    // EXTRACTION BLOCK WRAPPED SECURELY TO PREVENT MARKDOWN ENGINE DELETIONS
    const bearingStr = windParts["0"];
    const direction  = windParts["1"] || 'N';
    const speedStr    = windParts["2"];
    const gustStr     = windParts["3"];
    const tempStr    = windParts["4"];
    const chillStr   = windParts["5"];

    // Parse mapped string sequences securely into numeric floating calculations
    const bearing   = parseInt(bearingStr, 10) || 0;
    const speedMS   = (parseFloat(speedStr) / 10) || 0;
    const gustMS    = (parseFloat(gustStr) / 10) || 0;
    const airTemp   = tempStr !== undefined ? parseFloat(tempStr) : 0;
    const windChill = chillStr !== undefined ? parseFloat(chillStr) : 0;

    // Convert metrics into human-readable rounded integers
    const speedKMH     = Math.round(speedMS * 3.6);
    const gustKMH      = Math.round(gustMS * 3.6);
    const displayTemp  = Math.round(airTemp);
    const displayChill = Math.round(windChill);

    // Calculate Beaufort Scale thresholds from wind speed (m/s)
    let bftValue = 0;
    let bftDesc = "Calm";

    if (speedMS >= 0.3 && speedMS < 1.6)        { bftValue = 1;  bftDesc = "Light Air"; }
    else if (speedMS >= 1.6 && speedMS < 3.4)   { bftValue = 2;  bftDesc = "Light Breeze"; }
    else if (speedMS >= 3.4 && speedMS < 5.5)   { bftValue = 3;  bftDesc = "Gentle Breeze"; }
    else if (speedMS >= 5.5 && speedMS < 8.0)   { bftValue = 4;  bftDesc = "Moderate Breeze"; }
    else if (speedMS >= 8.0 && speedMS < 10.8)  { bftValue = 5;  bftDesc = "Fresh Breeze"; }
    else if (speedMS >= 10.8 && speedMS < 13.9) { bftValue = 6;  bftDesc = "Strong Breeze"; }
    else if (speedMS >= 13.9 && speedMS < 17.2) { bftValue = 7;  bftDesc = "Near Gale"; }
    else if (speedMS >= 17.2 && speedMS < 20.8) { bftValue = 8;  bftDesc = "Gale Force"; }
    else if (speedMS >= 20.8 && speedMS < 24.5) { bftValue = 9;  bftDesc = "Strong Gale"; }
    else if (speedMS >= 24.5 && speedMS < 28.5) { bftValue = 10; bftDesc = "Storm"; }
    else if (speedMS >= 28.5 && speedMS < 32.7) { bftValue = 11; bftDesc = "Violent Storm"; }
    else if (speedMS >= 32.7)                   { bftValue = 12; bftDesc = "Hurricane"; }

    // =========================================================================
    // DOM TREE REFRESH INJECTION LAYER
    // =========================================================================
    const titleEl = card.querySelector('.hmi-pack-label');
    if (titleEl && deviceName) {
        titleEl.textContent = deviceName;
    }

    // Capture column inner nodes
    const speedKmhEl = card.querySelector('.wind-speed-kmh');
    const speedMsEl  = card.querySelector('.wind-speed-ms');
    const gustKmhEl  = card.querySelector('.wind-gust-kmh');
    const chillEl    = card.querySelector('.wind-chill-temp');
    const tempEl     = card.querySelector('.wind-air-temp');
    if (speedKmhEl) speedKmhEl.textContent = speedKMH;
    if (speedMsEl)  speedMsEl.textContent  = "(" + Math.round(speedMS) + " m/s)";
    if (gustKmhEl)  gustKmhEl.textContent  = gustKMH;
    if (chillEl)    chillEl.textContent    = displayChill;
    if (tempEl)     tempEl.textContent     = displayTemp;

    // Capture lower notification row items
    const statusTextEl = card.querySelector('.wind-bf-value-desc');
    const directionEl  = card.querySelector('.wind-direction-cardinal');

    if (statusTextEl) statusTextEl.textContent = "F" + bftValue + " - " + bftDesc;
    if (directionEl)  directionEl.textContent  = "Direction: " + direction + " (" + bearing + "°)";

    // Managing warning badges dynamically
    const alertBadge = card.querySelector('.wind-alert-badge');
    if (alertBadge) {
        if (bftValue >= 8) {
            alertBadge.textContent = "STORM WARNING";
            alertBadge.style.display = "block";
            alertBadge.className = "hmi-badge hmi-alarm-state wind-alert-badge";
            if (statusTextEl) statusTextEl.style.color = "#c0392b";
        } else if (bftValue >= 6) {
            alertBadge.textContent = "STRONG WIND";
            alertBadge.style.display = "block";
            alertBadge.className = "hmi-badge hmi-warning-state wind-alert-badge";
            if (statusTextEl) statusTextEl.style.color = "#d35400";
        } else {
            alertBadge.textContent = "NO ALERT";
            alertBadge.style.display = "block";
            alertBadge.className = "hmi-badge hmi-warning-state wind-alert-badge";
            // alertBadge.style.display = "none";
            if (statusTextEl) statusTextEl.style.color = "";
        }
    }
}

/**
 * Updates text elements and gauge bars within a specified panel card.
 * @function updateHMIAnalogTile
 * @param {HTMLElement} element - The target tile container module block element.
 * @param {Object} data - Processed visual tracking property dataset package.
 * @param {string} data.status - The clean string text formatted for status badges.
 * @param {number} data.value - The raw numeric value floating-point calculation.
 * @returns {void}
 * @example: updateHMIAnalogTile(tileElement, {name: device.Name, value: rawValue, status: displayStatus, lastUpdate: device.LastUpdate});
 */
function updateHMIAnalogTile(element, data) {
    const valueField = element.querySelector('.hmi-value');
    
    // SAFELY PROCESS VALUE FIELD (Only run if it actually exists in HTML)
    if (valueField) {
        const textBehavior = valueField.getAttribute('data-text');

        if (textBehavior === "static") {
            // Do absolutely nothing! Text remains untouched.
        } else {
            // Standard behavior: Use the calculated status if no option is set
            valueField.textContent = data.status; 
        }
    } else {
        // If there is no valueField (like on your selector card), we log a clean message if DEBUG is on
        if (DEBUG) console.log(`updateHMIAnalogTile -> Safe Skip: Tile [IDX ${element.getAttribute('data-device-idx')}] has no .hmi-value element.`);
    }

    // SAFELY PROCESS STATUS BADGE (Only run if it actually exists in HTML)
    const statusBadge = element.querySelector('.hmi-clickable-badge') || element.querySelector('.hmi-badge');
    if (statusBadge) {
        statusBadge.textContent = String(data.status).toUpperCase();
    }
    
    // SAFELY PROCESS GAUGE BAR FILL ELEMENTS
    const barFill = element.querySelector('.hmi-bar-fill');
    const barText = element.querySelector('.hmi-bar-text');
    
    if (barFill && barText) {
        const numericValue = parseFloat(data.value) || 0;
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
        
        // HANDLE BADGE CLICK ACTIONS (Switches, Pumps, Valves, Blinds)
        const badge = event.target.closest('.hmi-clickable-badge');
        if (badge) {
			// Supported are card and innercard (a card-within-a-card)
            const card = badge.closest('.hmi-pack-card, .hmi-pack-innercard');
            if (!card) return;

            const idx = parseInt(card.getAttribute('data-device-idx'), 10);
            
            // Read the explicit action from the card if defined (e.g., "Toggle", "Stop")
            const explicitAction = card.getAttribute('data-action');
            let targetCommand;

            if (explicitAction) {
                // If data-action exists (Toggle or Stop), use it directly
                targetCommand = explicitAction;
            } else {
                // Fallback: smart logic if no data-action is specified
                const currentStatus = badge.textContent.trim().toUpperCase();
                const isCurrentlyOn = (currentStatus === "ON" || currentStatus === "RUNNING" || currentStatus === "OPEN" || (parseInt(currentStatus, 10) > 0));
                targetCommand = isCurrentlyOn ? "Turn Off" : "Turn On";
            }

            console.log("DEBUG CARD ELEMENT:", card);
            if (DEBUG) console.log(`addEventListener click idx=${idx} sending ${targetCommand}`);
            
            await sendDomoticzSwitchCommand(idx, targetCommand);
            return; 
        }

		// HANDLE THERMOSTAT UP/DOWN BUTTON CLICKS
        const tempBtn = event.target.closest('.hmi-temp-btn');
        if (tempBtn) {
            const card = tempBtn.closest('.hmi-pack-card');
            if (!card) return;

            const idx = parseInt(card.getAttribute('data-device-idx'), 10);
            
            // Look up the active value box from the current clicked element card
            const activeValueField = card.querySelector('.hmi-value');
            if (!activeValueField) return;

            let currentTemp = parseFloat(activeValueField.textContent) || 20.0;
            const isUpClick = tempBtn.classList.contains('btn-up');
            let newTemp = isUpClick ? currentTemp + 0.5 : currentTemp - 0.5;
            
            newTemp = newTemp.toFixed(1);

            // Instantly update EVERY copy of this specific thermostat card on your layout screen
            const allMatchingCards = document.querySelectorAll(`[data-device-idx="${idx}"]`);
            allMatchingCards.forEach(matchingCard => {
                const valueField = matchingCard.querySelector('.hmi-value');
                if (valueField) valueField.textContent = newTemp;
            });

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

    // SLIDER MOVING ACTION REAL-TIME (Real-time numbers while dragging)
    document.body.addEventListener('input', function(event) {
        const slider = event.target.closest('.hmi-slider');
        if (!slider) return;

        slider.isDragging = true; 
        const card = slider.closest('.hmi-pack-card');
        if (!card) return;

        const idx = card.getAttribute('data-device-idx');
        if (!idx) return;

        // FIX: Find every duplicate dimmer card with this IDX and match their numbers/sliders dynamically
        const allMatchingCards = document.querySelectorAll(`[data-device-idx="${idx}"]`);
        allMatchingCards.forEach(matchingCard => {
            // Update the text percentage indicator layout box
            const dimmerText = matchingCard.querySelector('.hmi-dimmer-text');
            if (dimmerText) dimmerText.textContent = slider.value;

            // Sync the physical input slider position bar handle smoothly if it isn't the one being touched
            const localSlider = matchingCard.querySelector('.hmi-slider');
            if (localSlider && localSlider !== slider) {
                localSlider.value = slider.value;
            }
        });
    });
	
	// SLIDER/SELECTOR CONTROLS RELEASED ENGINE (Fires command link to network for Sliders and Selectors)
    document.body.addEventListener('change', async function(event) {
        const slider = event.target.closest('.hmi-slider');
        const selector = event.target.closest('.hmi-selector-dropdown'); 
        
        if (!slider && !selector) return; // Exit if neither was changed

        const card = (slider || selector).closest('.hmi-pack-card');
        if (!card) return;

        const idx = parseInt(card.getAttribute('data-device-idx'), 10);
        let targetLevel;
        let switchCmd;

        if (slider) {
            slider.isDragging = false; 
            targetLevel = slider.value;
            switchCmd = (targetLevel == 0) ? "Off" : "Set%20Level";
            // console.log(`Dimmer Hardware Action -> Setting IDX ${idx} -> ${targetLevel}%`);
        } 
        else if (selector) {
            targetLevel = selector.value;
            switchCmd = "Set%20Level"; // Selectors always use Set Level
            // console.log(`Selector Hardware Action -> Setting IDX ${idx} -> Level ${targetLevel}`);
        }

        const commandUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=switchlight&idx=${idx}&switchcmd=${switchCmd}&level=${targetLevel}`;
		if (DEBUG) console.log("addEventListener change", commandUrl);
        try {
            const response = await fetch(commandUrl);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const result = await response.json();
            if (result.status === "OK") {
                setTimeout(fetchDomoticzData, 400);
            }
        } catch (error) {
            console.error(`Failed to dispatch control execution:`, error);
        }
    });	
	// END
}

/**
 * Dispatches an asynchronous switch execution command link to the network.
 * @async
 * @function sendDomoticzSwitchCommand
 * @param {number} idx - The unique Domoticz database hardware index identifier code.
 * @param {string} command - The target action string (e.g., "On", "Off", "Turn On", "Turn Off", "Toggle", "Stop").
 * @param {number} level - The level set by Dimmer or Selector.
 * @returns {Promise<void>}
 */
async function sendDomoticzSwitchCommand(idx, command, level = 0) {
    // Maps the command. Default is Off.
    let switchCmdValue = "Off";
	let targetLevel = level;
    
    if (command === "On" || command === "Turn On") {
        switchCmdValue = "On";
    } else if (command === "Toggle") {
        switchCmdValue = "Toggle";
    } else if (command === "Stop") {
        switchCmdValue = "Stop";
    } else if (command === "Set Level") {
        switchCmdValue = "Set Level"; // For dimmers and selectors
    }
    const commandUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=switchlight&idx=${idx}&switchcmd=${switchCmdValue}&level=${targetLevel}`;
    if (DEBUG) console.log("sendDomoticzSwitchCommand=", commandUrl);

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
	if (DEBUG) console.log("sendDomoticzSetpointCommand", commandUrl);

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
    const commandUrl = `${DOMOTICZ_URL}/#/Devices/${idx}/Log`;
	if (DEBUG) console.log("openDomoticzChart", commandUrl);
    window.open(commandUrl, '_blank'); // Opens chart in a new browser tab
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
    // console.log("Requesting data from Domoticz device IDX 6...");
    
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
            const commandUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=udevice&idx=${idx}&nvalue=0&svalue=${encodeURIComponent(targetValue)}`;
			if (DEBUG) console.log("setupGlobalTextInputListeners", commandUrl);
            const response = await fetch(commandUrl);
            
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

function setupLogInjectionListeners(tileElement) {
    const terminal = tileElement.querySelector('.hmi-log-terminal');
    const clearBtn = tileElement.querySelector('.hmi-log-clear-btn');
    const btn = tileElement.querySelector('.hmi-log-send-btn');
    const input = tileElement.querySelector('.hmi-log-input');

    // 1. SIMPLE CLEAR FIX: Include the log filter text so it passes your filter rule
    if (clearBtn && terminal) {
        clearBtn.addEventListener('click', function() {
            const filterText = tileElement.getAttribute('data-log-filter') || "";
            // We append the filter text invisibly or at the end so the fetch loop accepts it
            terminal.innerHTML = `<div class="hmi-log-line" style="color: #999;">Log cleared. Window idle... <!-- ${filterText} --></div>`;
        });
    }

    // 2. Safe check for SEND inputs
	// SEND Button and Input logic (only runs if BOTH elements actually exist)
    if (btn && input) {
		const dispatchMessage = async () => {
			const text = input.value.trim();
			if (!text) return;

			const targetUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=addlogmessage&message=${encodeURIComponent("[HMI Dashboard] " + text)}`;

			try {
				const response = await fetch(targetUrl);
				if (!response.ok) throw new Error(`HTTP error status: ${response.status}`);
				const result = await response.json();
				
				if (result.status === "OK") {
					input.value = "";
					setTimeout(fetchDomoticzData, 300);
				}
			} catch (err) {
				console.error("Logger data entry transmission anomaly:", err);
			}
		};

		btn.addEventListener('click', dispatchMessage);
		input.addEventListener('keypress', function(e) {
			if (e.key === 'Enter') {
				dispatchMessage();
			}
		});
	}
}

/*
	SERVERLOGS
*/

/**
 * Retrieves the master log database once and streams it locally to all log tiles.
 * @async
 * @function fetchDomoticzServerLogs
 * @returns {Promise<void>}
 */
async function fetchDomoticzServerLogs() {
    // 1. Grab EVERY log monitor tile currently loaded on the screen
    const logTiles = document.querySelectorAll('[data-type="log-monitor"]');
    if (logTiles.length === 0) return;

    /* FIX: Force the network call to ALWAYS pull all raw logs from Domoticz.
     * This ensures the browser receives the full log table array so each 
     * individual tile has the raw entries it needs to run its own filters. */
    const masterLogLevel = "268435455"; 
    const logUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=getlog&lastlogtime=0&loglevel=${masterLogLevel}`;

    try {
        const response = await fetch(logUrl);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();
        
        if (data.status === "OK" && data.result) {
            
            // Loop through each individual log tile found on your layout page
            logTiles.forEach(tileElement => {
                // Skip rendering if this specific tile is currently in a "clear log hold" state
                if (tileElement.hasAttribute('data-log-hold')) return;

                const terminal = tileElement.querySelector('.hmi-log-terminal');
                if (!terminal) return;

                const limit = parseInt(tileElement.getAttribute('data-log-limit'), 10) || 5;
                terminal.innerHTML = ""; 

                // Reset base entries array to the full server response on every iteration step
                let entries = data.result;

                /* CLIENT-SIDE CHANNEL DROPDOWN SELECTION FILTERING
                 * Look up the unique select element dropdown nested *inside* this specific tile matrix envelope */
                const channelSelect = tileElement.querySelector('.hmi-log-channel-select');
                const localLogLevel = channelSelect ? parseInt(channelSelect.value, 10) : 268435455;

                // If this tile is not set to show ALL LOGS, filter by bitwise channel mask properties
                if (localLogLevel !== 268435455) {
                    entries = entries.filter(item => {
                        // Domoticz categorizes log entry levels using integer bitmasks (1=status, 2=detail, 4=error)
                        return (item.level & localLogLevel) > 0;
                    });
                }
                
                // DECLARATIVE LOCAL TEXT FILTER PIPELINE
                const filterKeyword = tileElement.getAttribute('data-log-filter');
                if (filterKeyword && filterKeyword.trim() !== "") {
                    entries = entries.filter(item => item.message.includes(filterKeyword.trim()));
                }
                
                const finalEntries = entries.slice(-limit);
                
                finalEntries.forEach(item => {
                    const line = document.createElement('div');
                    line.className = "hmi-log-line";
                    line.textContent = item.message;

                    // High-Performance Keyword Color Evaluator
                    const upperMsg = item.message.toUpperCase();
                    if (upperMsg.includes("ERROR") || upperMsg.includes("CRITICAL")) {
                        line.classList.add("hmi-log-error");
                    } else if (upperMsg.includes("WARNING") || upperMsg.includes("EXCEPTION")) {
                        line.classList.add("hmi-log-warning");
                    } else if (upperMsg.includes("DZVENTS") || upperMsg.includes("LUA")) {
                        line.classList.add("hmi-log-script");
                    }
                    terminal.appendChild(line);
                });
                terminal.scrollTop = terminal.scrollHeight;

                // Bind listener configurations securely to this specific tile block instance
                if (!tileElement.hasAttribute('data-listeners-bound')) {
                    tileElement.setAttribute('data-listeners-bound', 'true');
                    setupLogInjectionListeners(tileElement);
                }
            });
        }
    } catch (err) {
        if (DEBUG) console.error("Log system synchronization exception:", err);
    }
}

/**
 * Executes a single batched HTTP query request to fetch statuses for all matrix sub-devices.
 * @async
 * @function fetchDomoticzMatrixStatus
 * @returns {Promise<void>}
 */
async function fetchDomoticzMatrixStatus() {
    const matrixTiles = document.querySelectorAll('[data-type="indicator-matrix"]');
    if (matrixTiles.length === 0) return;

    // Loop through each matrix tile found on the screen canvas independently
    matrixTiles.forEach(async (matrixTile) => {
        const idxString = matrixTile.getAttribute('data-device-idx') || "";
        if (!idxString) return;

        // Domoticz batch-device query endpoint syntax: param=getdevices with a comma-separated rid list
        const queryUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=getdevices&rid=${idxString}`;

        try {
            const response = await fetch(queryUrl);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const data = await response.json();
            
            if (data.status === "OK" && data.result) {
                const csvArray = idxString.split(",");

                // Loop through your 9 discrete cells sequentially from cellIndex 0 to 8
                csvArray.forEach((targetIdx, cellIndex) => {
                    const cellElement = matrixTile.querySelector(`[data-cell-index="${cellIndex}"]`);
                    if (!cellElement) return;

                    // Locate the specific sub-device configuration block returned inside the server payload
                    const deviceData = data.result.find(d => String(d.idx) === String(targetIdx));
                    
                    // Reset styling classes
                    cellElement.classList.remove('state-ok', 'state-error', 'state-disabled');

                    if (deviceData) {
                        const statusText = String(deviceData.Status || deviceData.Data || "").toUpperCase();
                        
                        // Execute high-performance color routing tree
                        if (statusText === "ERROR" || statusText === "ALARM" || statusText === "OFF") {
                            cellElement.classList.add('state-error');    // Black panel area profile
                        } else if (statusText === "DISABLED" || statusText === "GRAY" || statusText === "NONE") {
                            cellElement.classList.add('state-disabled'); // High-Contrast Gray
                        } else {
                            cellElement.classList.add('state-ok');       // White indicator area profile
                        }
                    } else {
                        // FIX 1: If device is missing entirely from the database query, force the high-contrast fallback state
                        cellElement.classList.add('state-disabled');
                    }
                });
            } else {
                // FIX 2: If network response status is empty or broken, drop ALL 9 cells to the legible fallback state
                const csvArray = idxString.split(",");
                csvArray.forEach((_, cellIndex) => {
                    const cellElement = matrixTile.querySelector(`[data-cell-index="${cellIndex}"]`);
                    if (cellElement) {
                        cellElement.classList.remove('state-ok', 'state-error', 'state-disabled');
                        cellElement.classList.add('state-disabled');
                    }
                });
            }
        } catch (err) {
            if (DEBUG) console.error("Matrix status synchronization exception:", err);
            // FIX 3: Network exception handler ensures cells remain legible on connection dropouts
            const csvArray = idxString.split(",");
            csvArray.forEach((_, cellIndex) => {
                const cellElement = matrixTile.querySelector(`[data-cell-index="${cellIndex}"]`);
                if (cellElement) {
                    cellElement.classList.remove('state-ok', 'state-error', 'state-disabled');
                    cellElement.classList.add('state-disabled');
                }
            });
        }
    });
}

/**
 * Binds control event listeners specifically to the unified log monitor tile components.
 * @function setupLogInjectionListeners
 * @param {HTMLElement} tileElement - The root DOM element container for the log tile.
 * @returns {void}
 */
function setupLogInjectionListeners(tileElement) {
    const btnSend = tileElement.querySelector('.hmi-log-send-btn');
    const btnClear = tileElement.querySelector('.hmi-log-clear-btn'); 
    const input = tileElement.querySelector('.hmi-log-input');
    const channelSelect = tileElement.querySelector('.hmi-log-channel-select');

    if (!input) return;

    const dispatchMessage = async () => {
        const text = input.value.trim();
        if (!text) return; 

        const customPrefix = tileElement.getAttribute('data-log-prefix') || "[HMI Dashboard]";
        const targetUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=addlogmessage&message=${encodeURIComponent(customPrefix + " " + text)}`;

        try {
            const response = await fetch(targetUrl);
            if (!response.ok) throw new Error(`HTTP error status: ${response.status}`);
            const result = await response.json();
            
            if (result.status === "OK") {
                input.value = ""; 
                setTimeout(fetchDomoticzServerLogs, 300); 
            }
        } catch (err) {
            console.error("Logger data entry transmission exception:", err);
        }
    };

    if (btnSend) btnSend.addEventListener('click', dispatchMessage);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') dispatchMessage(); });

    if (btnClear) {
        btnClear.addEventListener('click', async () => {
            const clearUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=clearlog`;
            try {
                const response = await fetch(clearUrl);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                const result = await response.json();
                
                if (result.status === "OK") {
                    const terminal = tileElement.querySelector('.hmi-log-terminal');
                    if (terminal) terminal.innerHTML = '<div class="hmi-log-line" style="font-style: italic; color: #777;">Master server log cleared successfully...</div>';
                    tileElement.setAttribute('data-log-hold', 'true');
                    setTimeout(() => {
                        tileElement.removeAttribute('data-log-hold');
                        fetchDomoticzServerLogs(); 
                    }, 2000);
                }
            } catch (err) {
                console.error("Failed to clear master server logs:", err);
            }
        });
    }

    if (channelSelect && !channelSelect.hasAttribute('data-listener-attached')) {
        channelSelect.setAttribute('data-listener-attached', 'true');
        channelSelect.addEventListener('change', fetchDomoticzServerLogs);
    }
}

/**
 * Redirects the browser viewport straight to the native Domoticz root control panel menu.
 * @function goToDomoticzDashboard
 * @returns {void}
 */
function goToDomoticzDashboard() {
    if (DEBUG) console.log("goToDomoticzDashboard Shifting viewport window back to main Domoticz desk.");
    
    // Directs the top-level frame layer window path to load the native dashboard
    window.top.location.href = `${DOMOTICZ_URL}/`;
}

/**
 * Redirects the browser viewport straight back to the custom HMITiles blueprints index grid.
 * Keeps navigation inside the active Domoticz single-page application framework.
 * @function goToHMITilesIndex
 * @returns {void}
 */
function goToHMITilesIndex() {
    if (DEBUG) console.log("goToHMITilesIndex: Shifting viewport window back to HMITiles Selection grid.");
    
    // Uses the global DOMOTICZ_URL constant to target the safe internal application hash route
    window.top.location.href = `${DOMOTICZ_URL}/#/Custom/HMITiles`;
}

/**
 * Global initialization handler to bind control listeners and kickstart background network polling cycles.
 * @listens DOMContentLoaded
 */
window.addEventListener('DOMContentLoaded', () => {
    fetchDomoticzData();
    setInterval(fetchDomoticzData, REFRESH_RATE);
    setupControlListeners();

	// =========================================================================
    // SYSTEM LOGGING INITIALIZATION ENGINE (SINGLE TIMING LOOP)
    // =========================================================================
	const logTile = document.querySelector('[data-type="log-monitor"]');
    if (logTile) {
        fetchDomoticzServerLogs();
        setInterval(fetchDomoticzServerLogs, 5000); // Simple, low-overhead 5s polling cycle
    }	

	// =========================================================================
    // INITIALIZE MATRIX INDICATOR ROUTINES IF THE SPECIALIZED COMPONENT EXISTS
    // =========================================================================
    const matrixTile = document.querySelector('[data-type="indicator-matrix"]');
    if (matrixTile) {
        fetchDomoticzMatrixStatus();
        setInterval(fetchDomoticzMatrixStatus, 5000); // Dedicated 5s polling loop
    }
	
});

