/**
 * @file hmitiles-preparser.js
 * @brief Process devices and assign values to the hmitiles.
 * @date 2026-07-21
 * @author Robert W.B. Linn (c) 2026 MIT
 * @description
 * This core engine parses, formats, and transforms telemetry device arrays received 
 * from the Domoticz server to map them directly to native UI dashboard components.
 * 
 * It manages base64 decoding, string interpolation, and floating-point conversions. 
 * Additionally, it features an adaptive chromatic scaling matrix that dynamically maps 
 * multi-tier threshold state layers to 4px contextual alarm borders. It natively implements 
 * (High-Performance HMI) accessibility standards by injecting descriptive text-based 
 * and symbolic priority indicators directly into live DOM title nodes for color-deficiency compliance.
 */

// =========================================================================
// IMPORTS
// =========================================================================

// Helper functions
import { parseDigits, parseFloats, decodeBase64, replaceString } from './hmitiles-preparser.js';
import { setTileValue, getUnit, getHistorySensor, preParseDeviceData } from './hmitiles-preparser.js';
// UI functions
import { updateCommunicationsStatus, updateTile, fetchAndRenderChart, DEBUG } from './hmitiles.js';

// =========================================================================
// PROCESSDEVICES
// =========================================================================

/**
 * Iterates through the Domoticz device inventory list and routes matching data attributes natively to the UI.
 * @function processDevices
 * @param {Array<Object>} devices - The raw array payload list containing active hardware device properties from the server.
 * @returns {void}
 */
export function processDevices(devices) {
	
    updateCommunicationsStatus(true);

    // =========================================================================
    // FAST MEMORY REGISTRY MATRIX MAP & GLOBAL OVERRIDE HOOK
    // =========================================================================
    const deviceRegistry = {};
    
    devices.forEach(device => {
        // Enforce broad fallbacks for property format safety
        const currentIdx = device.idx || device.Idx;
        if (!currentIdx) return;

        // Force the storage key to be an explicit clean text string
        const dictionaryKey = String(currentIdx).trim();

        // --- GLOBAL OVERRIDE HOOK RUNS NATIVELY ---
        if (typeof DEBUG !== 'undefined' && DEBUG) {
            console.log("[processDevices] Registry Map caching:", dictionaryKey, device.Data);
        }

        let hookRawValue = device.Data; 
        let hookDisplayStatus = device.Data || "";

        if (typeof window.onHMITileProcess === 'function') {
            const interceptResult = window.onHMITileProcess(null, device, hookRawValue, hookDisplayStatus);
            if (interceptResult === true) return; 
        }

        // Cache the entire device layout node
        deviceRegistry[dictionaryKey] = device;
		// console.log("[processDevices] idx", deviceRegistry[dictionaryKey].idx, "data", deviceRegistry[dictionaryKey].Data);
    });

    // =========================================================================
    // LINEAR DOM HTML TILE SCAN MATRIX (Multi-tile safe!)
    // =========================================================================
    // We grab all elements at once. If 3 separate HTML tiles share the same ID, 
    // this single loop finds and updates all 3 of them flawlessly!
	// It also supports innertile defined devices.
	const tiles = document.querySelectorAll('.hmi-pack-tile, .hmi-pack-innertile[data-device-idx]');

    let loopCounterIndex = 0;

    tiles.forEach(tileElement => {
		// Using LET inside the sub-loop means they can be re-assigned freely by 
		// the components, but they are guaranteed to reset perfectly back to the 
		// original Domoticz string whenever moving to a duplicate twin tile!
		let rawData = "";
		let rawValue = ""; 
		// Data shown in the badge
		let badgeText = "";
		// Text shown in the value field
		let valueText = rawValue;
		// Text shown in the data text box 
		let dataText = "";
		// Text for the device unit
		let unitText = "";

		// Reused logic variables once for the entire scope
		let labelConfig = "";
		let rawParts = [];
		let htmlGridString = "";
		let columns = [];

        // Read the mandatory tile type attribute (tag)
        const tileType = tileElement.getAttribute('data-type') || "standard";
		
		// Read the mandatoty data-device-idx
		const rawIdxAttr = tileElement.getAttribute('data-device-idx');
        if (!rawIdxAttr) {
			// console.warn(`[processDevices]: No data-device-idx defined in the HMITile for tile-type ${tileType}.`);
			// window.addDomoticzLog(4, `[processDevices]: No data-device-idx defined in the HMITile for tile-type ${tileType}.`);
			return;
		}

        // =========================================================================
        // UNIFIED DEVICE DATA PREPARATION ENGINE
        // =========================================================================
        const idxArray = rawIdxAttr.split(';').map(id => id.trim());

		// Init the device object 
        let device = null;

		// Check number of device idx if single or multi-device
        if (idxArray.length === 1) {

            // SINGLE DEVICE MODE: Use the true, unmodified native Domoticz object
            device = deviceRegistry[idxArray[0]];
			// Lifecycle restoration guard: Snapshot the true raw data string BEFORE mutations!
			// Snapshot the true raw data string BEFORE the preparser mutates it!
			rawData = String(device.Data || "").trim();
			rawValue = device.Data; 
			// Data shown in the badge
			badgeText = device.Data || "";

			// Run data preparation normalization step safely
			// Every tile instance receives a clean, un-mutated input!
			// The output is a modified device.Data property depending device type and HTML defintion
			preParseDeviceData(device, tileElement);
			
        } else {

            // MULTI-DEVICE MODE: Construct a unified virtual CSV payload object
            const csvPayloadParts = [];
            let lastUpdate = null;

            idxArray.forEach(id => {
                const subDevice = deviceRegistry[id];
                if (subDevice) {
                    // Clone the element to safely run it through the pre-parser
                    let deviceClone = { ...subDevice };

                    if (typeof preParseDeviceData === 'function') {
                        preParseDeviceData(deviceClone, tileElement); 
                    }

                    csvPayloadParts.push(String(deviceClone.Data || "0").trim());
					lastUpdate = deviceClone.LastUpdate;
                } else {
                    csvPayloadParts.push("0"); 
                }
            });

            // Build the virtual device object strictly for multi-device matching
            device = {
                idx: idxArray[0],                // Satisfies index tracking by using the first ID
                Data: csvPayloadParts.join(';'), // Unified CSV payload string: "400;0;98"
                LastUpdate: lastUpdate
            };
        }

		// SAFE GUARD: If Domoticz hasn't populated this device idx packet yet, 
		// skip rendering to prevent crashing out on undefined properties.
        if (!device) {
            if (typeof DEBUG !== 'undefined' && DEBUG) {
                console.warn(`[processDevices] Mapped index ${rawIdxAttr} not found in payload.`);
            }
            return; 
        }
				
        loopCounterIndex++; // Increment on every single tile pass
		
		// Adding the unique loopCounterIndex forces each log string output line to be 100% unique. 
		// This physically prevents the browser console from collapsing identical lines!
		// console.log(`>>> [PASS #${loopCounterIndex}]`, tileType, device.idx, rawData, device.Data);
		// console.log(">>>", tileType, device.idx, rawData, device.Data);
		
		if (DEBUG) console.log("processDevices idx=", device.idx, "tileType=", tileType, "rawvalue=", rawValue);
		
		// =========================================================================
		// UNIFIED EXPLICIT COMPONENT MATRIX USING TILETYPE
		// Core View Rendering Engine
		// =========================================================================
		switch (tileType) {

			// =========================================================================
			// STANDARD
			// =========================================================================
			case "standard": {
				// No action
				break;
			}

			// =========================================================================
			// INFO
			// =========================================================================
			case "info": {
				// If there is no device index bound to this card, check if it's an info block
				if (!device.idx) {
					// Exit the loop iteration immediately and leave HTML content untouched!
					return;
				}
				// Text from the device.Data
				const infoText = device.Data || "No Info";
				dataText += `
					<div class="hmi-info-text">${infoText}</div>
					`;
				// Set badge text empty to use default from HTML (see updateTile)
				badgeText = "";
				break;
			}

			// =========================================================================
			// VALUE (SINGLE TO MULTI-COLUMN)
			// =========================================================================
			// Synchronously parses unified multi-value data structures and 
			// generates high-density layout columns with balanced visual boundaries.
			// =========================================================================
			case "value": {
				// Display device data in columns with top title, middle value, bottom unit
				if (!device.Data) {
					dataText = "<div class='hmi-grid-error'>No device data</div>";
					break;
				}

				// MANDATORY CONFIGURATION ENFORCEMENT
				// If missing, reject layout loop immediately to protect grid boundaries
				const dataLabels = tileElement.getAttribute('data-labels');
				if (!dataLabels) {
					dataText = "<div class='hmi-grid-error'>Missing data-labels mapping</div>";
					break;
				}

				const rawDataParts = String(device.Data).split(';');
				htmlGridString = "<div class='hmi-multivalue-row'>";
				
				// Slice the layout configuration array cleanly (Max 7 horizontal columns)
				const columns = dataLabels.split(';').slice(0, 7);

				// Loop over the configured column definitions (INDEX:TITLE:UNIT)
				columns.forEach((col, index) => {
					const props = col.split(':'); 
					const segmentIdx = parseInt(props[0], 10) || 0;

					// DATA-LABELS IS THE MASTER: Read everything directly from the HTML map!
					let colTitle = (props[1] || "").trim();
					let colUnit  = (props[2] || "").trim(); 
					
					// Grab the raw value matching the exact segment index bucket
					let colValue = rawDataParts[segmentIdx] !== undefined ? rawDataParts[segmentIdx].trim() : "0";

					// Enforce visual fallback space guidelines to keep layout columns from collapsing
					if (colTitle === "") colTitle = "&nbsp;";
					if (colUnit === "")  colUnit = "&nbsp;";

					const borderStyle = (index < columns.length - 1) ? "style='border-right: 1px solid #e5e5e5;'" : "";

					// THE CLEAN REFACTOR: Remove the hardcoded borderStyle variable completely!
					let headerHtml = colTitle !== "&nbsp;" ? `<span class="hmi-multi-header">${colTitle}</span>` : "";
					let noTitleClass = colTitle === "&nbsp;" ? "hmi-no-title" : "";
					
					htmlGridString += `
						<div class="hmi-multivalue-col ${noTitleClass}">
							${headerHtml}
							<span class="hmi-multi-number">${colValue}</span>
							<span class="hmi-multi-unit">${colUnit}</span>
						</div>
					`;
				});
				
				htmlGridString += "</div>";
				dataText = htmlGridString;
				badgeText = ""; 
				break;
			}
			
			// =========================================================================
			// VALUEIMAGE
			// =========================================================================
			case "valueimage":
				badgeText = device.Data || "--";
				unitText = tileElement.getAttribute('data-unit') || "";
				if (unitText.length > 0) {
					badgeText = badgeText + " " + unitText;	
				}
				valueText = "";
				rawValue = parseFloat(device.Data) || 0;
				break;

			// =========================================================================
			// INPUT FIELD (TEXT OR NUMERIC)
			// =========================================================================
			case "input": {
				const targetGridContainer = tileElement.querySelector('.hmi-value-grid');
				if (!targetGridContainer) break;

				// Read current device status text to use as a placeholder or initial value
				rawValue = device.Data ? String(device.Data) : "";

				// Read input type
				const inputType = tileElement.getAttribute('data-input-type').toLowerCase() || "text";
				const placeholderPrompt = (inputType === "number") ? "Enter number..." : "Enter text...";

				// Build the rich input row and assign to data text
				dataText = `
					<input type="${inputType}" 
						   class="hmi-input-field" 
						   value="${rawValue}" 
						   placeholder="${placeholderPrompt}">
					<div class="hmi-action-row">
						<button class="hmi-btn-cancel">Cancel</button>
						<button class="hmi-btn-ok">OK</button>
					</div>
				`;

				// Maintain quiet status framework baseline rules
				badgeText = "SYNCED"; 
				break;
			}

			// =========================================================================
			// SWITCH
			// =========================================================================
			case "switch": {
				const badgeElement = tileElement.querySelector('.hmi-badge');
				const dataOnText = tileElement.getAttribute('data-on-text');
				const dataOffText = tileElement.getAttribute('data-off-text');
				const dataLevel = tileElement.getAttribute('data-level'); 
				const dataAction = tileElement.getAttribute('data-action'); // "On", "Off", or "Toggle"
				
				let isTileActive = false;
				let isSelector = (dataLevel !== null);

				// Multi-state Selector Button Row Track
				if (isSelector) {
					const currentLevel = parseDigits(device.Data);
					const targetLevel = parseInt(dataLevel, 10) || 0;
					isTileActive = (targetLevel === currentLevel);
				} 
				// Binary Switch Track (Handles Explicit On/Off & New Toggle Rows)
				else if (dataAction !== null) {
					const rawDeviceStatus = String(device.Data || "OFF").trim().toUpperCase();
					
					// If the HTML specifies a structural "Toggle" keyword action
					if (dataAction.toUpperCase() === "TOGGLE") {
						isTileActive = (rawDeviceStatus === "ON" || rawDeviceStatus === "PANIC");
					} else {
						// Check direct-match against server status OR match Domoticz native hardware emergency states
						if (rawDeviceStatus === "PANIC" && dataAction.toUpperCase() === "ON") {
							isTileActive = true;
						} else if ((rawDeviceStatus === "NORMAL" || rawDeviceStatus === "OK") && dataAction.toUpperCase() === "OFF") {
							isTileActive = true;
						} else {
							isTileActive = (rawDeviceStatus === dataAction.toUpperCase());
						}
					}
				} 
				// Fallback Single-Button Legacy Tiles Track
				else {
					const fallbackStatus = device.Data.toUpperCase();
					isTileActive = (fallbackStatus === "ON" || fallbackStatus === "PANIC");
				}
					
				// =========================================================================
				// FRAMEWORK VALUE-TEXT DEFINITION (PRESERVES NATIVE LABELS)
				// =========================================================================
				if (isTileActive) {
					// Fall back to attribute mappings first, then default to hardcoded "ON"
					valueText = dataOnText ? dataOnText : "ON";
					if (badgeElement) badgeElement.classList.add('hmi-active-state');
				} else {
					// Fall back to attribute mappings first, then default to hardcoded "OFF"
					valueText = dataOffText ? dataOffText : "OFF";
					if (badgeElement) badgeElement.classList.remove('hmi-active-state');
				}
				
				// =========================================================================
				// SAFE CONDITIONAL TEXT GENERATOR (FIXES THE BREAK)
				// =========================================================================
				if (badgeElement) {
					// ONLY overwrite the label text if the element is an explicit Toggle row 
					// OR if custom data-on/off text mapping attributes are actively supplied!
					if ((dataAction && dataAction.toUpperCase() === "TOGGLE") || dataOnText || dataOffText) {
						badgeElement.textContent = valueText;
					}
					// Otherwise, if it's an E-STOP or Standby button, we leave the HTML text completely alone!
				}

				if (isSelector || dataAction !== null) {
					badgeText = ""; 
				} else {
					badgeText = device.Data; 
				}

				rawValue = isTileActive ? 1 : 0;
				break;
			}
			
			// =========================================================================
			// SELECTOR DROPDOWN
			// =========================================================================
			// Dynamic selector dropdown engine (with base64 decryption).
			// The levels parsed from device.Data is 0,1,2,3. 
			// To set the value it must be miltiplied by 10 to align with the Domotict device settings.
			// =========================================================================
			case "selector": {
				const targetGridContainer = tileElement.querySelector('.hmi-value-grid');
				if (!targetGridContainer) break;

				const rawNames = device.LevelNames ? String(device.LevelNames) : "";
				const decodedNames = decodeBase64(rawNames); 
				const optionsArray = decodedNames ? decodedNames.split('|') : ["OFF"];

				// FIX: Find where device.Data ("AWAY") sits inside clean options array!
				// This gives you the exact live active level index automatically (0, 10, 20, 30)
				const activeIndex = optionsArray.findIndex(name => name.trim().toUpperCase() === String(device.Data).trim().toUpperCase());
				const currentLevel = activeIndex !== -1 ? activeIndex * 10 : 0;

				let dropdownOptionsHtml = "";
				optionsArray.forEach((name, index) => {
					const levelValue = index * 10; 
					const isSelected = (levelValue === currentLevel) ? 'selected="selected"' : '';
					
					dropdownOptionsHtml += `
						<option value="${levelValue}" ${isSelected}>${name.trim().toUpperCase()}</option>
					`;
				});

				dataText = `
					<div class="layout-slider">
						<select class="hmi-selector-dropdown">
							${dropdownOptionsHtml}
						</select>
					</div>
				`;

				rawValue = currentLevel;
				badgeText = ""; 
				break;
			}
			
			// =========================================================================
			// SLIDER DIMMER
			// =========================================================================
			case "dimmer":
			case "slider": {
				const unitText = tileElement.getAttribute('data-unit') || "";
				const targetGridContainer = tileElement.querySelector('.hmi-value-grid');
				if (!targetGridContainer) break;

				// =========================================================================
				// SAFE THROTTLE/SLIDER 100% OVERRIDE FIX
				// =========================================================================
				let cleanLevelVal = 0;
				const rawStatus = String(device.Status || device.Data || "").toUpperCase().trim();

				// If Domoticz flags the device state as explicitly ON, it means 100%
				if (device.nValue === 1 || rawStatus === "ON") {
					cleanLevelVal = 100;
				} else {
					// Otherwise, parse the digits out of the typical percentage string (e.g., "45%")
					cleanLevelVal = parseDigits(device.Data);
					
					// Fallback check if parseDigits returns NaN or invalid objects
					if (isNaN(cleanLevelVal) || cleanLevelVal === null || cleanLevelVal === "") {
						cleanLevelVal = 0;
					}
				}
				
				dataText = `
					<div class="hmi-multivalue-row">
						<div class="hmi-multivalue-col">
							<span class="hmi-multi-number">${cleanLevelVal}${unitText}</span>
						</div>
					</div>
					<div class="layout-slider" data-device-idx="${device.idx}">
						<input type="range"
							   min="0" 
							   max="100" 
							   value="${cleanLevelVal}"
							   class="hmi-slider">
					</div>
				`;
				break;
			}


			// =========================================================================
			// PROGRESSBAR
			// =========================================================================
			case "progressbar": {
				const unitText = tileElement.getAttribute('data-unit') || "";
				const targetGridContainer = tileElement.querySelector('.hmi-value-grid');
				if (!targetGridContainer) break;

				const cleanVal = parseFloats(device.Data).toFixed(0); 

				dataText = `
					<div class="hmi-multivalue-row">
						<div class="hmi-multivalue-col">
							<span class="hmi-multi-number">${cleanVal}${unitText}</span>
						</div>
					</div>
					<div class="hmi-bar-container">
						<div class="hmi-bar-fill" style="width: ${cleanVal}%"></div>
					</div>
				`;
				break;
			}
			
			// =========================================================================
			// SETPOINT & PROCESS VALUE LOGIC
			// =========================================================================
			case "setpoint":
			case "setpointprocessvalue": {
				const targetGridContainer = tileElement.querySelector('.hmi-value-grid');
				if (!targetGridContainer) break;

				// Get unit using preparser function to extract unit straight from Domoticz properties
				unitText = getUnit(device);

				// Parse out the target input Setpoint (SP) value
				const targetSetpoint = parseFloats(device.Data);
				// Set the setpoint as string with 1 digit
				const targetSetpointStr = targetSetpoint.toFixed(1);

				// =========================================================================
				// DYNAMIC STEPPER CALIBRATION
				// Safely extract the configuration increment value directly from the markup!
				// Fall back cleanly to 0.5 if the user omitted the data-step tag attribute.
				// =========================================================================
				const inputStepIncrement = parseFloat(tileElement.getAttribute('data-step')) || 0.5;
				// Ensure the step numbers format with strings matching negative signs correctly
				const negativeStepAction = `-${inputStepIncrement}`;
				const positiveStepAction = `${inputStepIncrement}`;
				// =========================================================================

				// Generate the unified, generic stepper HTML row with unit stacked underneath					
				const borderStyle = "style='border-right: 1px solid #e5e5e5;'";
				const noTitleClass = "hmi-no-title"; // Used to center contents vertically
				
				const stepperHtml = `
					<div class="hmi-stepper-row">
						<button class="hmi-btn-minus" data-action="${negativeStepAction}">-</button>
						<span class="hmi-value">${targetSetpointStr}</span>
						<button class="hmi-btn-plus" data-action="${positiveStepAction}">+</button>
					</div>
					<div align="center"><span class="hmi-multi-unit">${unitText}</span></div>
				`;
				
				// Standard Standalone Input Tile Setpoint
				if (tileType === "setpoint") {
					dataText = `
						<div class="hmi-value-grid">
							<div class="hmi-stepper-row">
								<button class="hmi-btn-minus" data-action="${negativeStepAction}">-</button>
								<span class="hmi-value">${targetSetpointStr}</span>
								<button class="hmi-btn-plus" data-action="${positiveStepAction}">+</button>
							</div>
							<div align="center"><span class="hmi-multi-unit">${unitText}</span></div>
						</div>
					`;
				}

				// Process Value + Setpoint Combo Tile
				if (tileType === "setpointprocessvalue") {
					const idxPV = tileElement.getAttribute('data-device-idx-pv');
					let pvDisplayVal = "0.0";

					if (idxPV) {
						const pvDevice = devices.find(d => String(d.idx) === String(idxPV));
						if (pvDevice && pvDevice.Data) {
							pvDisplayVal = parseFloats(pvDevice.Data).toFixed(1);
						}
					}

					// Stack the multi-value row FIRST so the PV (23.0) sits elegantly on top.
					// Wrap everything inside .hmi-value-grid so the CSS flex gap (10px) 
					// handles the line transitions, cleanly collapsing all the large vertical padding!
					dataText = `
						<div class="hmi-value-grid">
							<div class="hmi-multivalue-row">
								<div class="hmi-multivalue-col">
									<span class="hmi-multi-number">${pvDisplayVal}</span>
								</div>
							</div>
							<div class="hmi-stepper-row">
								<button class="hmi-btn-minus" data-action="${negativeStepAction}">-</button>
								<span class="hmi-value">${targetSetpointStr}</span>
								<button class="hmi-btn-plus" data-action="${positiveStepAction}">+</button>
							</div>
							<div align="center"><span class="hmi-multi-unit">${unitText}</span></div>
						</div>
					`;
				}

				break;
			}

			// =========================================================================
			// 24-HR TREND LINE CHART
			// =========================================================================
			case "trend": {
				const gridContainer = tileElement.querySelector('.hmi-value-grid');
				if (!gridContainer) break;

				// Build the HTML container string token using core rules!
				// This allows the master loop bottom to inject the element box safely 
				// without any risk of asynchronous race conditions overwriting it.
				dataText = `<div class="hmi-sparkline-container">Loading data logs...</div>`;
				valueText = replaceString(device.Data, ";", " ");
				
				// TIMEOUT QUEUE PASS:
				// Defer asynchronous network fetch operation for just a single millisecond tick.
				// This guarantees the core loop completes, injects the container onto the screen, 
				// and then safely passes the active node right to the parsing engine!
				setTimeout(() => {
					const targetChartBox = gridContainer.querySelector('.hmi-sparkline-container');
					if (targetChartBox) {
						fetchAndRenderChart(device, targetChartBox);
					}
				}, 1);
			  
				rawValue = 0;
				break;
			}
							
			// =========================================================================
			// 180° GAUGE
			// =========================================================================
			case "gauge": {
				const gridContainer = tileElement.querySelector('.hmi-value-grid');
				if (!gridContainer) break;

				// Extract values cleanly using proven formula
				const maxVal = parseFloat(tileElement.getAttribute('data-max')) || 100;

				// Compute percentage and SVG dashoffset path length (Full arc length = 126px)
				let percent = (device.tileValue / maxVal) * 100;
				if (percent > 100) percent = 100;
				if (percent < 0)   percent = 0;
				const strokeOffset = 126 - (126 * (percent / 100));

				// Drop the text overrides. Use the pure framework classes (.hmi-value)
				// so typography scales identically to the standard text cards.
				dataText = `
					<div class="hmi-gauge-view-box">
						<svg viewBox="0 0 100 50" 
							style="width: 100%; height: 100%; display: block; background: transparent !important;">

							<!-- BACKGROUND TRACK: The empty gray track from West (10,50) to East (90,50) -->
							<path d="M 10,50 A 40,40 0 0,1 90,50" 
								class="hmi-gauge-track-bg" />

							<!-- ACTIVE COLOR FILL: Direct rendering using theme colors -->
							<path d="M 10,50 A 40,40 0 0,1 90,50" 
								class="hmi-gauge-fill" 
								style="--gauge-offset: ${strokeOffset};" />
						</svg>

						<div class="hmi-gauge-center-readout">
							<span class="hmi-value">${device.tileValue}</span>
							<span class="hmi-multi-unit">${device.tileUnit}</span>
						</div>
					</div>
				`;

				badgeText = device.tileState;
				rawValue = 0;
				break;
			}

			// =========================================================================
			// 180° GAUGE WITH DIAL NEEDLE
			// =========================================================================
			case "gaugeneedle": {
				const gridContainer = tileElement.querySelector('.hmi-value-grid');
				if (!gridContainer) break;

				// Extract values
				const maxVal = parseFloat(tileElement.getAttribute('data-max')) || 100;

				// Compute percentage and SVG dashoffset path length (Full arc length = 126px)
				let percent = (device.tileValue / maxVal) * 100;
				if (percent > 100) percent = 100;
				if (percent < 0)   percent = 0;
				const strokeOffset = 126 - (126 * (percent / 100));

				// Compute needle angle rotation metric scale (0% = 0 deg, 100% = 180 deg)
				const needleRotationAngle = percent * 1.8;

				// Inject layout using the framework's native center-readout overlay structure
				// Inject the optimized layout template string payload with clean text layering
				// Inject the optimized layout template string payload with center hub removed
				dataText = `
					<div class="hmi-gauge-view-box" style="position: relative;">
						<svg viewBox="0 0 100 50" 
							style="width: 100%; height: 100%; display: block; background: transparent !important; z-index: 1; position: relative;overflow: visible !important;">

							<!-- BACKGROUND TRACK: The empty gray track from West (10,50) to East (90,50) -->
							<path d="M 10,50 A 40,40 0 0,1 90,50" 
								class="hmi-gauge-track-bg hmi-needle-gauge-track" />

							<!-- ACTIVE COLOR FILL: Direct rendering using theme colors -->
							<path d="M 10,50 A 40,40 0 0,1 90,50" 
								class="hmi-gauge-fill hmi-needle-gauge-fill" 
								style="--gauge-offset: ${strokeOffset};" />
							
							<!-- ANALOG POINTER NEEDLE: Rotates dynamically around the center (50,50) -->
							<line x1="10" y1="50" x2="50" y2="50" 
								class="hmi-gauge-needle" 
								style="transform: rotate(${needleRotationAngle}deg) !important; 
								transform-origin: 50px 50px !important;" />
							
							<!-- CENTER SOLID HUB PIN CAP -->
							<circle cx="50" cy="50" r="4" class="hmi-gauge-center-cap" />
						</svg>
					</div>
				`;
				badgeText = device.tileState;
				valueText = `${device.tileValue} ${device.tileUnit}`;
				rawValue = 0;
				break;
			}

			// =========================================================================
			// 90° SERVO GAUGE (North to East - Direct SVG Rendering)
			// =========================================================================
			case "gauge90needle": {
				const gridContainer = tileElement.querySelector('.hmi-value-grid');
				if (!gridContainer) break;

				// Extract values (0 for Min / North, 100 for Max / East)
				const maxVal = parseFloat(tileElement.getAttribute('data-max')) || 100;

				// Execute right before the switch/case evaluation begins processing elements:
				if (device.tileValue === undefined || device.tileValue === null || isNaN(parseFloat(device.tileValue))) {
					setTileValue(device);
					// Special case for onoff switch showing needle open (1) north, closed (0) east
					// Reverse values
					if (device.tileValue == 0) {
						device.tileValue = 1;
					} else  {
						device.tileValue = 0;
					}
				}
				if (device.tileUnit == undefined) device.tileUnit = "";

				// Compute percentage of your servo (0% to 100%)
				let percent = (device.tileValue / maxVal) * 100;
				if (percent > 100) percent = 100;
				if (percent < 0)   percent = 0;

				// Math: The 90° arc length is exactly 62.83px.
				const total90ArcLength = 62.83;
				const strokeOffset = total90ArcLength - (total90ArcLength * (percent / 100));
				
				// Compute needle angle: Starts at -90 deg (pointing straight North)
				// and sweeps 90 degrees clockwise to 0 deg (pointing straight East)
				const needleRotationAngle = -90 + (percent * 0.9);

				// Inject layout using direct, un-hijackable SVG paths
				dataText = `
					<div class="hmi-gauge-view-box" style="position: relative;">
						<svg viewBox="0 0 100 50" 
							style="width: 100%; height: 100%; display: block; background: transparent !important; z-index: 1; position: relative;overflow: visible !important;">
							
							<!-- BACKGROUND TRACK: The empty gray track from North (50,10) to East (90,50) -->
							<path d="M 50,10 A 40,40 0 0,1 90,50" 
								class="hmi-gauge-track-bg hmi-needle-gauge-track" />
							
							<!-- ACTIVE COLOR FILL: Forced inline definitions override global 180° CSS overrides -->
							<path d="M 50,10 A 40,40 0 0,1 90,50" 
								class="hmi-gauge-fill hmi-needle-gauge-fill" 
								style="stroke-dasharray: ${total90ArcLength} !important; 
								stroke-dashoffset: ${strokeOffset} !important; 
								--gauge-offset: ${strokeOffset};" />
							
							<!-- ANALOG POINTER NEEDLE: Pivots perfectly at center (50,50) -->
							<line x1="50" y1="50" x2="90" y2="50" 
								class="hmi-gauge-needle" 
								style="transform: rotate(${needleRotationAngle}deg) !important; transform-origin: 50px 50px !important;" />
							
							<!-- CENTER SOLID HUB PIN CAP -->
							<circle cx="50" cy="50" r="4" class="hmi-gauge-center-cap" />
						</svg>
					</div>
				`;

				badgeText = device.tileState;
				valueText = `${device.tileValue} ${device.tileUnit}`;
				rawValue = 0;
				break;
			}

			// =========================================================================
			// WIND COMPASS ROSE
			// =========================================================================
			case "compass": {
				const gridContainer = tileElement.querySelector('.hmi-value-grid');
				if (!gridContainer) break;

				// Isolate the wind direction text token from the pre-parsed array structure
				// If the data payload contains multiple segments, read from segment index 1.
				// device.Data structure WB;WD;WS;WG;T;C
				const rawDataStr = String(device.Data || "").trim();
				const segments = rawDataStr.split(';');
				
				// Set custom device properties
				device.tileValue = parseFloat(segments[2]);
				device.tileUnit = getUnit(device);
				device.tileWindBearing = segments.length > 1 ? `${segments[0].trim().toUpperCase()}°` : "";
				device.tileWindDirection = segments.length > 1 ? segments[1].trim().toUpperCase() : "N";
				device.tileWindTemp = segments.length > 1 ? `${segments[4].trim().toUpperCase()}°C` : "";

				// Cardinal direction angle dictionary map
				// Maps standard hardware string compass headings straight to absolute degrees
				const compassAngleMap = {
					'N': 0,   'NNE': 22.5, 'NE': 45,  'ENE': 67.5,
					'E': 90,  'ESE': 112.5,'SE': 135, 'SSE': 157.5,
					'S': 180, 'SSW': 202.5,'SW': 225, 'WSW': 247.5,
					'W': 270, 'WNW': 292.5,'NW': 315, 'NNW': 337.5
				};

				// Fallback to reading raw numeric degrees if Domoticz sends integers instead of words
				const rotationDegrees = compassAngleMap[device.tileWindDirection] !== undefined ? 
										compassAngleMap[device.tileWindDirection] : (parseFloat(device.tileWindDirection) || 0);

				// Inject the 360° circular vector layout
				dataText = `
					<div class="hmi-compass-view-box">
						<svg viewBox="0 0 100 100" 
							style="width: 100%; height: 100%; 
							display: block; 
							background: transparent !important;">
							<!-- 360° Outer Dial Ring Guideline Tracker -->
							<circle cx="50" cy="50" r="40" class="hmi-compass-dial-ring" />
							
							<!-- Cardinal Marker Ticks (N, E, S, W Line Guides) -->
							<line x1="50" y1="10" x2="50" y2="14" class="hmi-compass-tick" />
							<line x1="90" y1="50" x2="86" y2="50" class="hmi-compass-tick" />
							<line x1="50" y1="90" x2="50" y2="86" class="hmi-compass-tick" />
							<line x1="10" y1="50" x2="14" y2="50" class="hmi-compass-tick" />
							
							<!-- Semantic Text Letter Tags for quick directional context tracking -->
							<text x="50" y="5" class="hmi-compass-text-label">N</text>
							<text x="95" y="50" class="hmi-compass-text-label">E</text>
							<text x="50" y="95" class="hmi-compass-text-label">S</text>
							<text x="5" y="50" class="hmi-compass-text-label">W</text>
							
							<!-- DYNAMIC DIAMOND POINTER ARROW: Rotates smoothly around center hub (50,50) -->
							<g style="transform: rotate(${rotationDegrees}deg); transform-origin: 50px 50px; transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);">
								<!-- North Pointer Apex (Active Filled Triangle) -->
								<polygon points="50,16 54,50 46,50" class="hmi-compass-needle-north" />
								<!-- South Pointer Tail (Muted Silhouette Triangle) -->
								<polygon points="50,84 54,50 46,50" class="hmi-compass-needle-south" />
							</g>
							
							<!-- MECHANICAL CENTER CAP PIN -->
							<circle cx="50" cy="50" r="3.5" class="hmi-gauge-center-cap" />
						</svg>
					</div>
				`;

				badgeText = device.tileState;
				valueText = `${device.tileWindBearing} ${device.tileWindDirection} ${device.tileValue} ${device.tileUnit} ${device.tileWindTemp}`;
				rawValue = 0;
				break;
			}

			// =========================================================================
			// SAFETY FALLBACK: UNKNOWN OR UNHANDLED TILE TYPES
			// =========================================================================
			default:
				// Log a precise, actionable warning in the browser console for debugging
				console.warn(`[HMITILES] Unhandled or unknown data-type="${tileType}" discovered on Tile IDX=${device.idx}.`);
				
				// Fall back to displaying raw Domoticz values so the tile isn't left completely blank
				valueText = device.Data || "--";
				badgeText = tileElement.getAttribute('data-unit') || "";
				break;

		} // This is the end of case tile-type
			
		// Send out to core display text box renderer (all keys in lowercase)
		updateTile(tileElement, {
			idx: device.idx,
			badge: badgeText,
			value: valueText,
			data: dataText,
			lastupdate: device.LastUpdate
		});

		// =========================================================================
		// Reset hardware state for the next twin tile loop step
		// Restores the original string so the next twin tile reads from a clean baseline!
		// =========================================================================
		device.Data = rawData;
		
    }); // This is the existing device array loop ending bracket
}
