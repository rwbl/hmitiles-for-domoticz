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

    devices.forEach(device => {
		
		// Get the raw value from property data
		let rawValue = parseFloat(device.Data) || parseFloat(device.Status) || 0; 
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

		// =========================================================================
        // MULTI-TILE INSTANCE TARGET ROUTING ENGINE
        // =========================================================================
        // 1. Locate EVERY tile card container instance matching this specific device index
        const matchingTiles = document.querySelectorAll(`[data-device-idx="${device.idx}"]`);
        if (matchingTiles.length === 0) return; // Move to next device in your array if no HTML tile matches

        // 2. Iterate through each matching tile instance independently
        matchingTiles.forEach(tileElement => {

			// Read its custom card type configuration tag
			const cardType = tileElement.getAttribute('data-type') || "standard";

			if (DEBUG) console.log("processDevices idx=", device.idx, "cardType=", cardType);

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

				// FIX: Tell the card to act like it has "static" text behavior.
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
			if (device.Type === "Light/Switch" || cardType === "switch" || cardType === "pump" || cardType === "valve") {
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
			// WIND (Standalone Component)
			// =========================================================================
			if (device.Type === 'Wind') {
				// Fallback to zero string if device data string is empty
				const windRawData = device.Data || "0;N;0;0;0;0";
				
				// Core engine handler update
				updateWindTile(tileElement, windRawData, device.Name);
				
				return; // Exit loop routing cleanly
			}

			// =========================================================================
			// ANYOTHER DEVICE
			// =========================================================================
			if (!displayStatus) {
				displayStatus = device.Status || device.Data || "";
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
			// This fires automatically for EVERY device. If the card contains 
			// data-warn or data-crit attributes, it evaluates them natively!
			checkAlarmThresholds(device.idx, rawValue);

		}); // This closing brace seals the multi-tile .forEach loop blocks securely!
    }); // This is your existing device array loop ending bracket
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
 */
function updateHMIAnalogTile(element, data) {
    const valueField = element.querySelector('.hmi-value');
    
    // 1. SAFELY PROCESS VALUE FIELD (Only run if it actually exists in HTML)
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

    // 2. SAFELY PROCESS STATUS BADGE (Only run if it actually exists in HTML)
    const statusBadge = element.querySelector('.hmi-clickable-badge') || element.querySelector('.hmi-badge');
    if (statusBadge) {
        statusBadge.textContent = String(data.status).toUpperCase();
    }
    
    // 3. SAFELY PROCESS GAUGE BAR FILL ELEMENTS
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
            
            // 1. Read the explicit action from the card if defined (e.g., "Toggle", "Stop")
            const explicitAction = card.getAttribute('data-action');
            let targetCommand;

            if (explicitAction) {
                // If data-action exists (Toggle or Stop), use it directly
                targetCommand = explicitAction;
            } else {
                // 2. Fallback: Your original smart logic if no data-action is specified
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

    // Use the first tile's dropdown channel to drive the server request
    const channelSelect = logTiles[0].querySelector('.hmi-log-channel-select');
    const targetLogLevel = channelSelect ? channelSelect.value : "268435455";

    const logUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=getlog&lastlogtime=0&loglevel=${targetLogLevel}`;

    try {
        const response = await fetch(logUrl);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();
        
        if (data.status === "OK" && data.result) {
            
            // 2. Loop through each individual log tile found on your layout page
            logTiles.forEach(tileElement => {
                // Skip rendering if this specific tile is currently in a "clear log hold" state
                if (tileElement.hasAttribute('data-log-hold')) return;

                const terminal = tileElement.querySelector('.hmi-log-terminal');
                if (!terminal) return;

                const limit = parseInt(tileElement.getAttribute('data-log-limit'), 10) || 5;
                terminal.innerHTML = ""; 

                let entries = data.result;
                
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
                            cellElement.classList.add('state-error');    // Black
                        } else if (statusText === "DISABLED" || statusText === "GRAY" || statusText === "NONE") {
                            cellElement.classList.add('state-disabled'); // Gray
                        } else {
                            cellElement.classList.add('state-ok');       // White
                        }
                    } else {
                        // Fallback: If device is missing entirely from server database, force a Gray Disabled state
                        cellElement.classList.add('state-disabled');
                    }
                });
            }
        } catch (err) {
            if (DEBUG) console.error("Matrix status synchronization exception:", err);
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

