/**
 * @file hmitiles.js
 * @brief Core JavaScript engine for the HMITiles-for-Domoticz framework.
 * @date 2026-07-12
 * @author Robert W.B. Linn (c) 2026 MIT
 * @version 2.0.0-Beta
 * @description 
 * Manages industrial-inspired tile updates, trend lines, network polling, 
 * and interactive controls for the Domoticz platform.
 */

// =========================================================================
// GLOBAL CONFIGURATION SETTINGS
// =========================================================================

// Set to true to see logs in console, false to hide
const DEBUG = false; 

// Domoticz server URL with two options
// Option 1: Domoticz server (f.e. running on Windows 11 or Raspberry Pi 5 OS Trixie)
const DOMOTICZ_URL = window.parent && window.parent.$ ? window.parent.$.domoticzurl : window.location.origin;
// Option 2: Python simulator (folder tools)
// const DOMOTICZ_URL ="http://127.0.0.1:8080";

// Set refresh rate to 1 minute (60000) minimum for Domoticz
const REFRESH_RATE = 15000;		// Tests
// const REFRESH_RATE = 60000;

// Imports from the preparser: conversion, domoticz helpers
import { parseDigits, parseFloats, decodeBase64, replaceString } from './hmitiles-preparser.js';
import { getUnit, getHistorySensor, preParseDeviceData } from './hmitiles-preparser.js';

// Bridge the isolation wall: Expose the helper globally to inline index.html scripts!
window.parseDigits = parseDigits;
window.parseFloats = parseFloats;
window.parseFloats = replaceString;
window.getUnit = getUnit;
window.getHistorySensor = getHistorySensor;

// =========================================================================
// FETCHDOMOTICZDATA
// =========================================================================

// Start the safe loop automatically when the page loads
// window.addEventListener('DOMContentLoaded', fetchDeviceData);
async function fetchDomoticzData() {
    try {
		const commandUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=getdevices&filter=all`;
		if (DEBUG) console.log("[fetchDomoticzData]", commandUrl);
		
        const response = await fetch(commandUrl);
        if (!response.ok) throw new Error(`[fetchDomoticzData][E] Network response: ${response.status}`);
        
        const data = await response.json();
        if (data.result) {
            processDevices(data.result);
        }
    } catch (error) {
        console.error("[fetchDomoticzData] Can not fetch:", error);
        updateCommunicationsStatus(false);
    }
}

// =========================================================================
// PROCESSDEVICES
// =========================================================================

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
		
        // =========================================================================
		// GLOBAL OVERRIDE HOOK = MUST AT VERY TOP OF THE LOOP
        // =========================================================================
		// Create baseline variables that hold the raw Domoticz values first
		let hookRawValue = device.Data; 
		let hookDisplayStatus = device.Data || "";
    
        // This lets dedicated pages process data arrays regardless of how elements are configured in HTML!
        // Allow custom pages to intercept the device payload before standard rendering takes place
        if (typeof window.onHMITileProcess === 'function') {
            const interceptResult = window.onHMITileProcess(null, device, hookRawValue, hookDisplayStatus);
            // If the custom page function handles it and returns true, skip generic processing
            if (interceptResult === true) return; 
        }

		// =========================================================================
        // MULTI-TILE INSTANCE TARGET ROUTING ENGINE
        // =========================================================================
        // Locate EVERY tile container instance matching this specific device index
        const matchingTiles = document.querySelectorAll(`[data-device-idx="${device.idx}"]`);
        
		// Move to next device in array if no HTML tile matches
		if (matchingTiles.length === 0) return;
		
		// console.log(">>> matchingtiles", matchingTiles.length);
		// Initialize a local incremental loop marker directly before matchingTiles iteration loop pass
		let loopCounterIndex = 0;

		// Iterate through each matching tile instance independently on the page context
		matchingTiles.forEach(tileElement => {
			loopCounterIndex++; // Increment on every single tile pass

			// Read the tile type configuration tag
			const tileType = tileElement.getAttribute('data-type') || "standard";

			// =========================================================================
			// Lifecycle restoration guard
			// Snapshot the true raw data string BEFORE the preparser mutates it!
			// =========================================================================
			const rawData = String(device.Data || "").trim();

			// Run data preparation normalization step safely
			// Every tile instance receives a clean, un-mutated input!
			// The output is a modified device.Data property depending device type and HTML defintion
			preParseDeviceData(device, tileElement);
			
			// Adding the unique loopCounterIndex forces each log string output line to be 100% unique. 
			// This physically prevents the browser console from collapsing identical lines!
			// console.log(`>>> [PASS #${loopCounterIndex}]`, tileType, device.idx, rawData, device.Data);
			// console.log(">>>", tileType, device.idx, rawData, device.Data);

			// Using LET inside the sub-loop means they can be re-assigned freely by 
			// the components, but they are guaranteed to reset perfectly back to the 
			// original Domoticz string whenever moving to a duplicate twin tile!
			let rawValue = device.Data; 
			// Data shown in the badge
			let badgeText = device.Data || "";
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
			
			if (DEBUG) console.log("processDevices idx=", device.idx, "tileType=", tileType, "rawvalue=", rawValue);
			/*
			console.log("processDevices idx=", device.idx, 
				"tileType=", tileType, 
				"type=", device.Type, 
				"subtype=", device.SubType, 
				"switchtype=", device.SwitchType, 
				"rawvalue=", rawValue);
			*/

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
						const currentLevel = parseDigits(device.Data) * 10;
						const targetLevel = parseInt(dataLevel, 10) || 0;
						isTileActive = (targetLevel === currentLevel);
					} 
					// Binary Switch Track (Handles Explicit On/Off & New Toggle Rows)
					else if (dataAction !== null) {
						const rawDeviceStatus = String(device.Data || "OFF").trim().toUpperCase();
						
						// If the HTML specifies a structural "Toggle" keyword action
						if (dataAction.toUpperCase() === "TOGGLE") {
							isTileActive = (rawDeviceStatus === "ON");
						} else {
							// Explicit actions (like "On" or "Off") continue to direct-match against server status
							isTileActive = (rawDeviceStatus === dataAction.toUpperCase());
						}
					} 
					// Fallback Single-Button Legacy Tiles Track
					else {
						isTileActive = (device.Data.toUpperCase() === "ON");
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

                    const cleanLevelVal = parseDigits(device.Data);
                    
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
							<svg viewBox="0 0 100 50" style="width: 100%; height: 100%; display: block; background: transparent !important;">
								<path d="M 10,50 A 40,40 0 0,1 90,50" class="hmi-gauge-track-bg" />
								<path d="M 10,50 A 40,40 0 0,1 90,50" class="hmi-gauge-fill" style="--gauge-offset: ${strokeOffset};" />
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

					// Inject the optimized, needle-exclusive layout template string payload
					dataText = `
						<div class="hmi-gauge-view-box">
							<svg viewBox="0 0 100 50" style="width: 100%; height: 100%; display: block; background: transparent !important;">
								<path d="M 10,50 A 40,40 0 0,1 90,50" class="hmi-gauge-track-bg hmi-needle-gauge-track" />
								<path d="M 10,50 A 40,40 0 0,1 90,50" class="hmi-gauge-fill hmi-needle-gauge-fill" style="--gauge-offset: ${strokeOffset};" />
								
								<!-- ANALOG POINTER NEEDLE: Rotates dynamically around the center (50,50) -->
								<line x1="10" y1="50" x2="50" y2="50" class="hmi-gauge-needle" style="transform: rotate(${needleRotationAngle}deg); transform-origin: 50px 50px;" />
								
								<!-- CENTER SOLID HUB PIN PIN CAP -->
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
					console.warn(`[HMI ENGINE] Unhandled or unknown data-type="${tileType}" discovered on Tile IDX=${device.idx}.`);
					
					// Fall back to displaying raw Domoticz values so the tile isn't left completely blank
					valueText = device.Data || "--";
					badgeText = tileElement.getAttribute('data-unit') || "";
					break;
			
			}	// End Case tiletype

			/*
			console.log("processDevices", 
						"idx=", device.idx, 
						"type=", device.Type, 
						"tiletype=", tileType,
						"name=", device.Name, 
						"valuetext=", valueText, 
						"rawvalue=", rawValue,
						"badgetext=", badgeText, 
						"dataText=", dataText, 
						"lastupdate=", device.LastUpdate);
			*/

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

		}); // This closing brace seals the multi-tile .forEach loop blocks securely!
    }); // This is the existing device array loop ending bracket
}


// =========================================================================
// UPDATETILE
// =========================================================================

/**
 * Updates text elements and gauge bars within a specified panel tile.
 * @function updateTile
 * @param {HTMLElement} element - The target tile container module block element.
 * @param {Object} data - Processed visual tracking property dataset package.
 * @param {number} data.idx - Idx of the device (not used yet).
 * @param {string} data.badge - Text for the badge (top right).
 * @param {number} data.value - Value to be displayed in the value field.
 * @param {number} data.data - Text to be displayed in the data text box.
 * @param {string} data.lastupdate - Text for the badge (top right).
 * @returns {void}
 * @example: updateTile(tileElement, {idx: device.idx,badge: badgeText,value: valueText,info: dataText,lastupdate: device.LastUpdate});
 */
function updateTile(element, data) {
	// console.log("[updateTile] idx", data.idx, , "badge", data.badge, "value", data.value, "data", data.data, "lastupdate", data.lastupdate);
	
	// Check if idx > 0 else do nothing and leave this function
	if (data.idx === "0" || !data.idx) return;
	
    // Badge 
    const statusBadge = element.querySelector('.hmi-badge') || element.querySelector('.hmi-clickable-badge');
    if (statusBadge) {
		// Check if data.status is set else use what is defined in HTML
		if (data.badge != "") {
			statusBadge.textContent = String(data.badge).toUpperCase();
		}
    }
  
    // Value field 
    const valueField = element.querySelector('.hmi-value');
    if (valueField) {
		valueField.textContent = data.value; 
    }

	// Data text box - note the usage of innerHTML to allow HTML tags in the text
	const dataField = element.querySelector('.hmi-value-grid');
	if (dataField) {
		dataField.innerHTML = data.data;
	}

	// Last value (if exists in HTML element)
	const lastValueLabel = element.querySelector('.hmi-last-value');
    if (lastValueLabel) {
		lastValueLabel.textContent = data.value;
    }
	
	// Last update (if exists in HTML element)
	const lastUpdateLabel = element.querySelector('.hmi-last-update');
    if (lastUpdateLabel) {
		lastUpdateLabel.textContent = data.lastupdate; 
    }
}

/**
 * Updates the tile badge text
 * @function updateTileBadge
 * @param {string} text - The clean string text formatted for status badges.
 * @returns {void}
 * @example: updateTileBadge(tileElement, "UP");
 */
function updateTileBadge(element, text) {
    const statusBadge = element.querySelector('.hmi-badge') || element.querySelector('.hmi-clickable-badge');
    if (statusBadge) {
		statusBadge.textContent = String(text).toUpperCase();
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

// =========================================================================
// BINDCONTROLS
// =========================================================================

/**
 * Registers global event routing handlers to bind click, input, and sliding actions.
 * Main initialization runner to attach event boundaries onto newly rendered items.
 * Fires once per data synchronization cycle right after the HTML strings are injected.
 * @function bindControls()
 * @returns {void}
 */
function bindControls() {
    bindSwitchControls();   // Clicks for buttons/switches
    bindStepperControls();  // Clicks for thermostat plus/minus
    bindInputControls();    // Clicks for OK/Cancel data entry
	bindChartControls();    // Click events for opening device charts in new tab
    bindAnalogControls();   // Change events for Sliders and Selectors
}

/**
 * Attaches a permanent global event listener to handle binary switches and multi-button selectors.
 */
function bindSwitchControls() {
    document.body.addEventListener('click', async function(event) {
        // TARGET MATCH: Check if the clicked target belongs to a clickable badge inside any switch container cell
        const button = event.target.closest('[data-type="switch"] .hmi-clickable-badge');
        if (!button) return; 

        // Safely pull upwards to the immediate sub-cell container box (handles both hor & vert panels!)
        const innerTile = button.closest('[data-type="switch"]');
        if (!innerTile) return;

        const idx = parseInt(innerTile.getAttribute('data-device-idx'), 10);
        const dataAction = innerTile.getAttribute('data-action'); 
        const dataLevel = innerTile.getAttribute('data-level');   

        let commandUrl = "";
        
        if (dataAction) {
            commandUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=switchlight&idx=${idx}&switchcmd=${dataAction}`;
        } else if (dataLevel !== null) {
            const targetLevel = parseInt(dataLevel, 10);
            commandUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=switchlight&idx=${idx}&switchcmd=Set%20Level&level=${targetLevel}`;
        }

        if (commandUrl === "") return;
        if (DEBUG) console.log("[Switch Dispatched URL]", commandUrl);
        try {
            await fetch(commandUrl);
            setTimeout(fetchDomoticzData, 400); // Triggers standard UI loop data refresh sync
        } catch (err) {
            console.error("Switch layout control failure:", err);
        }
    });
}

/**
 * Attaches a permanent global event listener to handle plus/minus thermostat setpoint changes.
 */
function bindStepperControls() {
    document.body.addEventListener('click', async function(event) {
        // Look upwards from the click target to see if it belongs to a stepper adjustment button
        const button = event.target.closest('.hmi-stepper-row button');
        if (!button) return;

        const tile = button.closest('.hmi-pack-tile');
        if (!tile) return;

        const idx = parseInt(tile.getAttribute('data-device-idx'), 10);
        const actionStep = parseFloat(button.getAttribute('data-action')); // Extracts -0.5 or 0.5
        
        const displaySpan = tile.querySelector('.hmi-value');
        if (!displaySpan) return;
        
        const currentVal = parseFloats(displaySpan.textContent);
        const nextSetpoint = (currentVal + actionStep).toFixed(1);

        // Optimistic UI response: update the screen value instantly with zero lags
        displaySpan.textContent = `${nextSetpoint}${tile.getAttribute('data-unit') || ""}`;

        const commandUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=setsetpoint&idx=${idx}&setpoint=${nextSetpoint}`;
        
        if (DEBUG) console.log("[Stepper Dispatched URL]", commandUrl);
        try {
            await fetch(commandUrl);
        } catch (err) {
            console.error("Climate adjustment execution failed:", err);
        }
    });
}

/**
 * Attaches permanent global event listeners to handle data entry typing, OK, and Cancel actions.
 */
function bindInputControls() {
    // Handle Button Click Actions (OK and Cancel)
    document.body.addEventListener('click', async function(event) {
        const inputButton = event.target.closest('.hmi-pack-tile[data-type="input"] .hmi-action-row button');
        if (!inputButton) return;

        const tile = inputButton.closest('.hmi-pack-tile');
        if (!tile) return;

        const idx = parseInt(tile.getAttribute('data-device-idx'), 10);
        const inputField = tile.querySelector('.hmi-input-field');

        // CANCEL OPTION: Direct fallback roll-back command
        if (inputButton.classList.contains('hmi-btn-cancel')) {
            if (DEBUG) console.log("[Data Entry Canceled]", idx);
            fetchDomoticzData(); 
        } 
        
        // OK SUBMISSION: Send data changes straight through to the hardware endpoint
        else if (inputButton.classList.contains('hmi-btn-ok')) {
            if (!inputField) return;
            const freshValue = inputField.value.trim();
            if (freshValue === "") return;

            const commandUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=udevice&idx=${idx}&nvalue=0&svalue=${encodeURIComponent(freshValue)}`;
            
            if (DEBUG) console.log("[Data Entry Transmitted URL]", commandUrl);
            try {
                const response = await fetch(commandUrl);
                const result = await response.json();
                if (result.status === "OK") {
                    // Update the status badge indicator back to synced immediately upon success
                    const badge = tile.querySelector('.hmi-badge');
                    if (badge) badge.textContent = "SYNCED";
                    
                    setTimeout(fetchDomoticzData, 400); 
                }
            } catch (err) {
                console.error("Input data dispatch failure:", err);
            }
        }
    });

    // Handle Keyboard Enter-key Shortcuts directly inside the fields
    document.body.addEventListener('keypress', function(event) {
        const inputField = event.target.closest('.hmi-pack-tile[data-type="input"] .hmi-input-field');
        if (!inputField) return;

        if (event.key === "Enter") {
            const tile = inputField.closest('.hmi-pack-tile');
            const okButton = tile?.querySelector('.hmi-btn-ok');
            if (okButton) {
                event.preventDefault(); 
                okButton.click();       
            }
        }
    });

    // Fires instantly whenever text/numbers are modifies inside an entry box
    document.body.addEventListener('input', function(event) {
        const inputField = event.target.closest('.hmi-pack-tile[data-type="input"] .hmi-input-field');
        if (!inputField) return;

        const tile = inputField.closest('.hmi-pack-tile');
        const badge = tile?.querySelector('.hmi-badge');
        
        if (badge) {
            // Instantly transition badge text to alert the user changes are in-progress
            badge.textContent = "EDITING"; 
        }
    });
}

/**
 * Attaches a permanent global event listener to handle opening charts for clickable tiles.
 */
function bindChartControls() {
    document.body.addEventListener('click', function(event) {
        const clickableTile = event.target.closest('.hmi-clickable-tile');
        if (!clickableTile) return;

        // Guard safety layer: Do not trigger chart popup windows if interacting with controls
        if (event.target.closest('.hmi-clickable-badge, button, input, select, .hmi-slider')) {
            return;
        }

        const idx = parseInt(clickableTile.getAttribute('data-device-idx'), 10);
        if (isNaN(idx)) return;

        if (DEBUG) console.log("[Chart Triggered] Opening database history for IDX:", idx);
        
        // Execute exact Domoticz native chart popup pipeline function smoothly
        openDomoticzChart(idx);
    });
}

/**
 * Attaches a permanent global event listener to handle range sliders and dropdown selectors.
 */
function bindAnalogControls() {
    document.body.addEventListener('change', async function(event) {
        const slider = event.target.closest('.hmi-slider');
        const selector = event.target.closest('.hmi-selector-dropdown'); 
        if (!slider && !selector) return; // Exit instantly if neither was changed

        const tile = (slider || selector).closest('.hmi-pack-tile');
        if (!tile) return;

        const idx = parseInt(tile.getAttribute('data-device-idx'), 10);
        let targetLevel;
        let switchCmd;

        // DIMMER / SLIDER LOGIC TRACK
        if (slider) {
            targetLevel = slider.value;
            switchCmd = (targetLevel == 0) ? "Off" : "Set%20Level";
            
            // Optimistic UI update: instantly update the numerical text above the bar track while dragging
            const displaySpan = tile.querySelector('.hmi-multi-number');
            if (displaySpan) {
                const unitText = tile.getAttribute('data-unit') || "";
                displaySpan.textContent = `${targetLevel}${unitText}`;
            }
        } 
        // DROPDOWN SELECTOR LOGIC TRACK
        else if (selector) {
            targetLevel = selector.value;
            switchCmd = "Set%20Level"; 
        }

        const commandUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=switchlight&idx=${idx}&switchcmd=${switchCmd}&level=${targetLevel}`;
        if (DEBUG) console.log("[Analog Dispatched URL]", commandUrl);
        
        try {
            const response = await fetch(commandUrl);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const result = await response.json();
            if (result.status === "OK") {
                setTimeout(fetchDomoticzData, 400); // Trigger fast dashboard refresh sync
            }
        } catch (error) {
            console.error(`Failed to dispatch analog control execution:`, error);
        }
    });
}

// =========================================================================
// COMMANDS
// =========================================================================

/**
 * Dispatches an asynchronous switch execution command link to the network.
 * @async
 * @function sendSwitchCommand
 * @param {number} idx - The unique Domoticz database hardware index identifier code.
 * @param {string} command - The target action string (e.g., "On", "Off", "Turn On", "Turn Off", "Toggle", "Stop").
 * @param {number} level - The level set by Dimmer or Selector.
 * @returns {Promise<void>}
 */
async function sendSwitchCommand(idx, command, level = 0) {
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
        switchCmdValue = "Set%20Level"; // For dimmers and selectors
    }
    const commandUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=switchlight&idx=${idx}&switchcmd=${switchCmdValue}&level=${targetLevel}`;
    if (DEBUG) console.log("[sendSwitchCommand]", commandUrl);

    try {
        const response = await fetch(commandUrl);
        if (!response.ok) throw new Error(`HTTP request failed: ${response.status}`);
        const result = await response.json();
        if (result.status === "OK") {
            setTimeout(fetchDomoticzData, 300);
        }
    } catch (error) {
        console.error(`[sendSwitchCommand] Failed to dispatch:`, error);
    }
}

/**
 * Dispatches an asynchronous temperature setpoint modification command to the Domoticz server.
 * @async
 * @function sendSetpointCommand
 * @param {number} idx - The unique Domoticz database hardware index identifier code.
 * @param {string|number} targetTemperature - The target thermostat temperature value (e.g., 21.5).
 * @returns {Promise<void>}
 */
async function sendSetpointCommand(idx, targetTemperature) {
    const commandUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=setsetpoint&idx=${idx}&setpoint=${targetTemperature}`;
	if (DEBUG) console.log("sendSetpointCommand", commandUrl);

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


// =========================================================================
// SERVERLOG
// =========================================================================

/**
 * Retrieves the master log database once and streams it locally to all log tiles.
 * @async
 * @function fetchDomoticzServerLogs
 * @returns {Promise<void>}
 */
async function fetchDomoticzServerLogs() {
    // Grab EVERY log monitor tile currently loaded on the screen
    const logTiles = document.querySelectorAll('[data-type="logmonitor"]');
    if (logTiles.length === 0) return;

    /* Force the network call to ALWAYS pull all raw logs from Domoticz.
     * This ensures the browser receives the full log table array so each 
     * individual tile has the raw entries it needs to run its own filters. */
    const masterLogLevel = "268435455"; 
    const logUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=getlog&lastlogtime=0&loglevel=${masterLogLevel}`;

    try {
        const response = await fetch(logUrl);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();
        
        if (data.status === "OK" && data.result) {
            
            // Loop through each individual log tile found on the HTML layout page
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

// =========================================================================
// INTEGRATED SPARKLINE RENDERING UTILITIES (TREND GRAPH DAY RANGE)
// =========================================================================

async function fetchAndRenderChart(device, container) {
    try {
        const idx = parseInt(device.idx, 10);
        const sensor = getHistorySensor(device);
        const baseUrl = window.DOMOTICZ_URL || window.location.origin;
        const targetUrl = `${baseUrl}/json.htm?type=command&param=graph&sensor=${sensor}&idx=${idx}&range=day`;
        
        const response = await fetch(targetUrl);
        if (!response.ok) throw new Error();
        const data = await response.json();
        
        if (data.result && data.result.length > 0) {
            const points = data.result.map(item => {
                const valueKeys = Object.keys(item).filter(key => key !== "d");
                const activeMetricKey = valueKeys[0];
                return activeMetricKey ? parseFloat(item[activeMetricKey] || 0) : 0;
            });

			// In case required the last real time data-point
            // const lastDataPointVal = points[points.length - 1];

			// Create the chart
            renderEmbeddedSparkline(container, points);

        } else {
            container.innerHTML = '<span class="hmi-chart-stat-label">No historical logs</span>';
        }
    } catch (err) {
        console.error("Trend loop pipeline tracking error:", err);
        container.innerHTML = "<span style='color:#ff0000; font-size:12px;'>API Error</span>";
    }
}

// Create the chart embedded in the tile (100% FIXED STATIC VECTOR GRID)
function renderEmbeddedSparkline(container, dataPoints) {
    const width = 300;
    const height = 90;
    const padding = 1;

    const min = Math.min(...dataPoints);
    const max = Math.max(...dataPoints);
    const range = max - min === 0 ? 1 : max - min;

    const coords = dataPoints.map((val, index) => {
        const x = padding + (index / (dataPoints.length - 1)) * (width - padding * 2);
        const y = (height - (padding)) - ((val - min) / range) * (height - (padding) * 2);
        return `${x},${y}`;
    });

    container.innerHTML = `
        <div class="hmi-sparkline-svg-wrapper">
			<svg viewBox="0 0 ${width} ${height}" 
				class="hmi-sparkline-svg" preserveAspectRatio="none">
				<path class="hmi-trend-line" d="M ${coords.join(' L ')}" />
			</svg>
        </div>
        <div class="hmi-trend-stats"">
            <div><span class="hmi-chart-stat-label">MIN:</span> ${Math.round(min)}</div>
            <div><span class="hmi-chart-stat-label">MAX:</span> ${Math.round(max)}</div>
        </div>
    `;
}

// =========================================================================
// OPENURLS
// =========================================================================

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
 * Redirects the browser viewport straight to the native Domoticz root control panel menu.
 * @function goToDomoticzDashboard
 * @returns {void}
 */
function goToDomoticzDashboard() {
    if (DEBUG) console.log("goToDomoticzDashboard Shifting viewport window back to main Domoticz desk.");
    
    // Directs the top-level frame layer window path to load the native dashboard
    window.top.location.href = `${DOMOTICZ_URL}/`;
}

// EXPOSE TO GLOBAL SCOPE: This allows the HTML inline onclick handler to find the function
window.goToDomoticzDashboard = goToDomoticzDashboard;

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

// EXPOSE TO GLOBAL SCOPE: This allows the HTML inline onclick handler to find the function
window.goToHMITilesIndex = goToHMITilesIndex;

// =========================================================================
// MAIN
// =========================================================================

/**
 * Global initialization handler to bind control listeners and kickstart background network polling cycles.
 * @listens DOMContentLoaded
 */
window.addEventListener('DOMContentLoaded', () => {

	// Sets up the permanent background delegated event hooks
    bindControls(); 
    	
	// Get the domoticz device data for all devices
    fetchDomoticzData();

	// And do this every 60 secs (or any other value > 60 secs)
    setInterval(fetchDomoticzData, REFRESH_RATE);

	// =========================================================================
    // SYSTEM LOGGING INITIALIZATION ENGINE (SINGLE TIMING LOOP)
    // =========================================================================
	const logTile = document.querySelector('[data-type="logmonitor"]');
    if (logTile) {
        fetchDomoticzServerLogs();
        setInterval(fetchDomoticzServerLogs, 5000); // Simple, low-overhead 5s polling cycle (5000)
    }	
	
});

