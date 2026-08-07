/**
 * @file hmitiles-preparser.js
 * @brief Core Normalization & Feature Extraction Layer
 * @date 2026-07-22
 * @author Robert W.B. Linn (c) 2026 MIT
 * @description
 * This layer intercepts incoming raw Domoticz hardware payloads before the UI 
 * render pipeline kicks off. It extracts isolated attributes into unified, 
 * collision-immune presentation properties (`tileValue`, `tileUnit`, `tileState`)
 * while providing controlled compatibility transformations on `device.Data`.
*/

// Simple internal helper wrapper to keep console neat if DEBUG is turned off
export function printDebugLog(...args) {
    if (window.DEBUG || typeof DEBUG !== 'undefined' && DEBUG) {
        printDebugLog("[HMITiles Log]", ...args);
    }
}

/* ================================
 * UTILITY CONVERSION FUNCTIONS
 * ================================ */

/**
 * Utility to extract numbers safely from strings (e.g., "45 cb" -> 45)
 */
export function parseDigits(str) {
    if (!str) return 0;
    const matches = String(str).match(/\d+/);
    return matches ? parseInt(matches[0], 10) : 0;
}

/**
 * Utility to extract floating-point decimals from strings (e.g., "23.5 C" -> 23.5)
 * @param {string|number} str - The raw incoming text or data from Domoticz.
 * @param {number} [decimalPlaces] - Optional precision padding to force trailing zeros.
 * @returns {number|string} True float value, or precision string if decimalPlaces is provided.
 */
export function parseFloats(str) {
    if (!str) return 0.0;
    const matches = String(str).match(/[-+]?[0-9]*\.?[0-9]+/);
    return matches ? parseFloat(matches[0]) : 0.0;
}

/**
 * Decodes Base64 strings sent by Domoticz APIs (e.g. for Selector LevelNames)
 */
export function decodeBase64(str) {
    if (!str) return "";
    try {
        // atob() is the standard web API to decode Base64 data strings natively
        return atob(str.trim());
    } catch (e) {
        console.warn("[decodeBase64] Decoding skipped/failed:", e);
        return str; // Safe fallback return if string is already raw text
    }
}

/**
 * Replaces all occurrences of a specific target string with a new replacement string.
 * 
 * @param {String} text - The raw source data string to look inside of.
 * @param {String} searchFor - The exact character or text string you want to find (e.g., ";", ",", " ").
 * @param {String} replaceWith - The new character or text you want to inject instead.
 * @returns {String} The finalized, cleanly swapped display string.
 */
export function replaceString(text, searchFor, replaceWith = " ") {
    if (!text) return "";
    
    const cleanSource = String(text).trim();
    
    // If the target search character doesn't exist in the text, return the source safely
    if (!cleanSource.includes(searchFor)) return cleanSource;
    
    // Split on the exact target and join with the new replacement string globally
    return cleanSource.split(searchFor).join(replaceWith);
}

/**
 * Extracts the first valid numeric segment out of any mixed Domoticz text string.
 * Accurately processes formats like: "250 ppm", "100%", or "Set Level: 50%".
 * 
 * @param {Object} device - The active raw device data node package.
 * @returns {String} The isolated clean numeric payload word.
 */
function parseSingleValue(device) {
    const rawData = device.Data;
    const cleanString = String(rawData || "").trim();

    if (!cleanString) {
        device.tileUnit = "";
        return "0";
    }

    // REGEX SCAN MATRIX: Matches the first numeric block, supporting decimals (. or ,)
    const match = cleanString.match(/[-+]?\d*[\.,]\d+|\d+/);
    if (!match) {
        device.tileUnit = "";
        return "0";
    }

    // Match[0] contains the extracted raw number chunk (e.g., "250")
    const rawNumericString = match[0].replace(',', '.');

    // =========================================================================
    // DYNAMIC UNIT EXTRACTION LOGIC
    // Slice everything following the matched number block and scrub whitespace
    // =========================================================================
    const numericIndex = match.index;
    const numericLength = match[0].length;
    
    // Grab the leftover string portion located straight after the number digits
    let isolatedUnit = cleanString.slice(numericIndex + numericLength).trim();

    // CONVERSION PIPELINE: Route through native parsing engine helper
    let isolatedValue = 0;
    if (typeof parseFloats === "function") {
        isolatedValue = parseFloats(rawNumericString);
    } else {
        isolatedValue = parseFloat(rawNumericString) || 0;
    }

    // Preserve custom internal properties natively on the device object reference
    device.tileValue = isolatedValue;
    device.tileUnit = isolatedUnit; // Dynamically populates "", "%", "ppm", "W", etc.
	
    // Returns a pure data string token clean of units or formatting text!
    return String(isolatedValue);
}

/* ================================
 * UTILITY GENERIC FUNCTIONS
 * ================================ */

// getPercentageChange
// console.log(getPercentChange(100, 150)); //  50 (50% increase)
// console.log(getPercentChange(100, 75));  // -25 (25% decrease)
export function getPercentChange(oldVal, newVal) {
  if (oldVal === 0) return newVal === 0 ? 0 : Infinity; 
  return ((newVal - oldVal) / oldVal) * 100;
}

/* ================================
 * UTILITY DOMOTICS FUNCTIONS
 * ================================ */

/**
 * Normalizes Domoticz textual states into clean numeric floats for HMI Gauges
 * @param {Object} device - The active Domoticz device data structure
 */
export function setTileValue(device) {
    // If a clean numeric value already exists, preserve it and exit
    if (device.tileValue !== undefined && device.tileValue !== null && !isNaN(parseFloat(device.tileValue))) {
        device.tileValue = parseFloat(device.tileValue);
        return;
    }

    // Safely extract the raw status textual string payload
    const rawData = String(device.Data || device.tileValue || '').trim().toUpperCase();

    // Check for standard Boolean discrete switch text flags
    if (rawData === "ON") {
        device.tileValue = 1;
        return;
    }
    if (rawData === "OFF") {
        device.tileValue = 0;
        return;
    }

    // Extract numeric percentages from strings like "Set Level 20%" or "Level 45%"
    if (rawData.includes("SET LEVEL") || rawData.includes("LEVEL")) {
        // Regular expression maps any integer match sequence inside the string bounds
        const matchNumber = rawData.match(/\d+/);
        if (matchNumber) {
            device.tileValue = parseFloat(matchNumber[0]);
            return;
        }
    }

    // Default structural fallback safely handles empty values
    device.tileValue = 0;
	device.tileUnit = "";
}

/**
 * Resolves the required historical graph api sensor keyword string 
 * based natively on inconsistent Domoticz hardware type definitions.
 * Checkout the exact case in the Domoticz API docs.
 * @param {object} device - The raw JSON payload device object data from the server.
 * @returns {string} The explicit query string keyword parameter ("counter", "temp", "rain", "wind", "percentage").
 */
export function getHistorySensor(device) {
    if (!device) return "counter"; // Safe industrial global default fallback baseline

    const devType    = String(device.Type || "").toUpperCase();
    const devSubType = String(device.SubType || "").toUpperCase();

	// Rain, UV and others
    if (devType.includes("RAIN") || devSubType.includes("RAIN")) {
        return "rain";
    }

    if (devType.includes("UV") || devSubType.includes("UV")) {
        return "uv";
    }

    // Check for climate/weather temperature indicators
    if (devType.includes("TEMP") || devType.includes("WEATHER") || devSubType.includes("TEMP")) {
        return "temp";
    }

    // Check for anemometer wind vectors
    if (devType.includes("WIND") || devSubType.includes("WIND")) {
        return "wind";
    }

    // Check for percentages
    if (devType.includes("GENERAL") || devSubType.includes("PERCENTAGE")) {
        return "Percentage";
    }

    // Check for electrical energy, percentages, or high-impact utility usage logs
    if (devType.includes("USAGE") || devSubType.includes("ELECTRIC")) {
        return "counter";
    }

    // Default catch-all ceiling for air quality, generic counters, and single-value metrics
    return "counter";
}

/**
 * Unified Level and State Pre-Parser Engine
 * Uses array indices to map both text state words and color alert levels simultaneously.
 * Automatically scales to handle 2-state, 3-state, or 5-state arrays dynamically.
 * 
 * @param {HTMLElement} tileElement - The active layout tile card chassis node.
 * @param {Number} stateVal - The live, float-parsed telemetry sensor value.
 * @returns {Object} Clean data wrapper structure: { text: "GOOD", level: 1 }
 */
export function processTileStateAndAlarm(tileElement, stateVal) {
    const result = { text: "", level: 0 };
    if (!tileElement) return result;

    const stateMapAttr = tileElement.getAttribute('data-state-map');
    if (!stateMapAttr) return result;

    const rules = stateMapAttr.split(',');
    const totalStates = rules.length;
    const direction = tileElement.getAttribute('data-alarm-direction') || "up";

    let matchedIdx = 0; // Default fallback to Index 0

    // Core threshold index lookup (Pure numeric execution loop)
    for (let i = 0; i < totalStates; i++) {
        const parts = rules[i].split(':');
        if (parts.length < 2) continue;

        const threshold = parseFloat(parts[0].trim());

        if (direction === "up") {
            if (stateVal >= threshold) matchedIdx = i;
        } else {
            if (stateVal <= threshold) matchedIdx = i;
        }
    }

    // Extract the matching descriptive text word cleanly
    const finalParts = rules[matchedIdx].split(':');
    result.text = finalParts.length > 1 ? finalParts[1].trim() : "";

    // =========================================================================
    // ADAPTIVE STATE ROUTER (DYNAMIC CHROMATIC SCALE MATCHING)
    // Maps matched index slot to 4px CSS classes based on array length!
    // =========================================================================
    let activeClassStr = "gray";

    if (totalStates === 2) {
        // 2-State Rule Map (0 = Gray/Green, 1 = Red)
        activeClassStr = (matchedIdx === 1) ? "red" : "gray";
    } 
    else if (totalStates === 3) {
        // 3-State Rule Map (0 = Gray, 1 = orange, 2 = red)
        const threeStateClasses = ["gray", "orange", "red"];
        activeClassStr = threeStateClasses[matchedIdx] || "gray";
    } 
    else {
        // Standard Full 5-Tier Severity Map (0-4)
        const fiveStateClasses = ["gray", "green", "yellow", "orange", "red"];
        activeClassStr = fiveStateClasses[matchedIdx] || "gray";
    }

    // Write the clean color modifier attribute straight onto tile element chassis
    tileElement.setAttribute("data-alarm", activeClassStr);

    // =========================================================================
	// TITLE ICON INJECTION SYSTEM
	// =========================================================================
	const titleElement = tileElement.querySelector('.tile-header') || tileElement.querySelector('*:first-child');

	if (titleElement) {
		const iconMap = {
			"yellow": "[!] ",
			"orange": "[!!] ",
			"red": "[▲] "
		};
		const newPrefix = iconMap[activeClassStr] || "";

		// Clean up previous text-based icons safely
		let currentText = titleElement.textContent;
		currentText = currentText.replace(/^\[!\]\s*|^\[!!\]\s*|^\[▲\]\s*/, "");

		// Re-inject using innerHTML, wrapping the prefix or title text 
		// to preserve bold styling tags natively!
		titleElement.innerHTML = `<div class="hmi-pack-label">${newPrefix}${currentText}</div>`;
	}
	
    result.level = matchedIdx;
    return result;
}

/**
 * Captures the current system time and updates the visible header container timestamp placeholder block.
 * @function updateDashboardTimestamp
 * @returns {void}
 */
 /*
function updateDashboardTimestamp() {
    const now = new Date();
    const timeString = now.toLocaleTimeString(); // Format HH:MM:SS
    document.getElementById("hmi-last-update").innerText = timeString;
}
*/

/* ================================
 * PREPARSER
 * ================================ */

/**
 * Main orchestration function for device preprocessing and payload standardization.
 * Master Pre-Parser Entry Point.
 * Standardizes raw Domoticz values and executes real-time alarm thresholds.
 * @param {Object} device - The shared Domoticz device data reference object.
 * @param {HTMLElement} tileElement - The active target HTML DOM card chassis component.
 * @returns Device data as a standard semicolon row to feed columns perfectly.
 */
export function preParseDeviceData(device, tileElement) {
    if (!device || !device.Data || !tileElement) return;

    // Reset presentation variables cleanly
    device.tileValue = undefined;
    device.tileUnit  = undefined;
    device.tileState = undefined;

    // Run explicit hardware exclusion selectors (Waterflow, Climate, etc.)
    preParseDevices(device, tileElement);

    let csvPayload = String(device.Data).trim();

    // =========================================================================
    // THE UNIFIED SELECTION WIN: UNCOMPLEX PIPELINE OVERRIDE
    // =========================================================================
    if (tileElement.hasAttribute('data-state-map')) {
        const currentNumericVal = typeof parseFloats === "function" ? parseFloats(csvPayload) : parseFloat(csvPayload);
        
        // Process both text words and color levels all inside one unified function call!
        const evaluation = processTileStateAndAlarm(tileElement, currentNumericVal);
        
        device.tileState = evaluation.text;
        
        // Re-pack metrics into standard semicolon row to feed columns perfectly
        device.Data = `${currentNumericVal};${evaluation.text}`;
        return;
    }

    device.Data = csvPayload;
}

/**
 * Advanced Device Pre-Parser Engine
 * Routes Domoticz devices to specialized handlers based on their primary Type.
 * Explicitly breaks irregular hardware variations down into unified semicolon rows.
 * These are assigned to the device Data property used by tile handling in processDevices.
 * @param {Object} device - The raw incoming Domoticz device data block reference.
 * @param {HTMLElement} tileElement - The active host layout chassis node.
 * @returns {Boolean} Returns true if a signature matched and handled the payload.
 * @todo
 * Device Fan
 */
export function preParseDevices(device, tileElement) {
    if (!device) return;

    let csvPayload = undefined;

    switch (device.Type) {
        case "General":
            csvPayload = preParseGeneral(device, tileElement);
            break;
            
        case "Light/Switch":
            csvPayload = preParseLightSwitch(device);
            break;

        case "Color Switch":
            csvPayload = preParseColorSwitch(device);
            break;

        case "Humidity":
        case "Rain":
        case "Temp + Humidity":
        case "Temp + Baro":
        case "Temp + Humidity + Baro":
        case "Wind":
            csvPayload = preParseWeather(device);
            break;

        // Group all known standard single-value categories together safely!
        case "Air Quality":
		case "Lux":
        case "UV":
        case "Weight":
            csvPayload = parseSingleValue(device);
            break;

		// Energy
		case "Current":
        case "P1 Smart Meter":
        case "Usage":
			csvPayload = preParseEnergy(device);

        default:
            // Optional fallback trace if an unconfigured device type enters the pipeline
            break;
    }

    // Lifecycle Commit: Mutate the device data node payload if a match occurred
    if (csvPayload !== undefined) {
        device.Data = csvPayload;
    }
}

/* ================================
 * PREPARSER TYPE FUNCTIONS
 * ================================ */
 
// Type General with subtype handling.
function preParseGeneral(device, tileElement) {
    switch (device.SubType) {

		case "Alert": {
			// 1. Map values directly to their matching array index positions (0-4)
			const alertLevels = ["gray", "green", "yellow", "orange", "red"];
			
			// 2. Fetch the color string instantly using the integer level as the index
			const levelIndex = parseInt(device.Level, 10);
			const alertLevelStr = alertLevels[levelIndex] || "gray";

			// 3. Inject the color modifier tag directly onto the tile element chassis!
			tileElement.setAttribute("data-alarm", alertLevelStr);
			return String(device.Data).trim();
		}

        case "Barometer":
			return `${device.Barometer};${device.ForecastStr}`;

		case "Counter Incremental":
			return `${parseFloats(device.Counter)};${parseFloats(device.CounterToday)}`;

		case "Custom Sensor":
			// Converts "250 unit" -> "250"
			return parseSingleValue(device);

		case "Distance":
			// Converts "250 cm" -> "250"
			return parseSingleValue(device);

        case "kWh": {
            // Wrap the strings in an object so the function can assign properties safely!
            const cleanToday = parseSingleValue({ Data: device.CounterToday || "0" });
            const cleanUsage = parseSingleValue({ Data: device.Usage || "0" });
            return `${cleanToday};${cleanUsage}`;
        }

		case "Leaf Wetness":
			// Converts "250" -> "250"
			return parseSingleValue(device);

		case "Managed Counter":
			return `${parseFloats(device.Counter)}`;

		case "Percentage":
			return `${parseSingleValue(device)}`;

		case "Pressure":
			// Converts "250 Bar" -> "250"
			return parseSingleValue(device);

		case "Soil Moisture":
			// Converts "250 cb" -> "250"
			return parseSingleValue(device);

		case "Solar Radiation":
			// Converts "250 Watt/m2" -> "250"
			return parseSingleValue(device);

		case "Sound Level":
			// Converts "65 dB" -> "65"
			return parseSingleValue(device);

		case "Text":
			return device.Data;

		case "Visibility":
			// Converts "10.3 km" -> "10.3"
			return parseSingleValue(device);

		case "Voltage":
			// Converts "250 V" -> "250"
			return parseSingleValue(device);

		case "Waterflow":
			// Converts "0 l/min" -> "0"
			return parseSingleValue(device);

        // Catch-all fallback for all single-value General devices (Distance, Pressure, Sound, etc.)
        default:
            return parseSingleValue(device);
    }
}

function preParseLightSwitch(device) {
    // Domoticz normalizes switch configurations via numeric or text SwitchType properties
    const switchType = String(device.SwitchType || "").trim();

    switch (switchType) {
		case "Dimmer":
		case "On/Off":
		case "Push On Button":
		case "Push Off Button":
			return device.Data;
		case "Selector":
			return device.Level;
        default:
            // Standard on/off binary switches simply use their raw state text string ("ON"/"OFF")
            return String(device.Data || "OFF").trim();
    }
}

function preParseColorSwitch(device) {
    // Domoticz normalizes switch configurations via numeric or text SwitchType properties
    const subType = String(device.SubType || "").trim();
    const switchType = String(device.SwitchType || "").trim();

    switch (subType) {
		case "WW":
			// 0-100
			// device.Level
			// '{"b":0,"cw":14,"g":0,"m":2,"r":0,"t":241,"ww":241}'
			// device.Color = 
			return String(device.Data || "OFF").trim();

		case "RGB":
			// 0-100
			// device.Level
			// '{"b":0,"cw":14,"g":0,"m":2,"r":0,"t":241,"ww":241}'
			// device.Color = 
			return String(device.Data || "OFF").trim();

        default:
            // Standard on/off binary switches simply use their raw state text string ("ON"/"OFF")
            return String(device.Data || "OFF").trim();
    }
}

function preParseWeather(device) {
    const humstat = device.HumidityStatus === "Comfortable" ? "COMF" : (device.HumidityStatus || "");

    switch (device.Type) {
        case "Humidity":
            return `${device.Humidity};${humstat}`;

		case "Rain":
			if (device.SubType === "TFA") {
				// Type Rain, SubType TFA
				// Normalizes multi-value precipitation records into a clean data contract row
				// Converts "100 mm, 200 mm" or "100, 200" -> "100;200"
				const rawInput = String(device.Data || "0, 0");
				const items = rawInput.split(',');
				// Extract numbers using framework's native parsing helper
				const rainRate  = typeof parseFloats === "function" ? parseFloats(items[0]) : parseFloat(items[0]) || 0;
				const rainTotal = typeof parseFloats === "function" ? parseFloats(items[1]) : parseFloat(items[1]) || 0;
				return `${rainRate};${rainTotal}`;
			}
			else {
				return undefined;
			}

        case "Wind":
			// WB;WD;WS;WG;T;TWS
			// device.Data returns the default values.
			// If units set different then wrong data returned
			// The temperature and temperaturechill are not properties and are extracted from device.DATA
			const items = device.Data.split(';');
			const temp = items[4];
			const tempChill = items[5];
            return `${device.Direction};${device.Direction};${device.Speed};${device.Gust};${temp};${tempChill}`;

        case "Temp + Humidity":
            return `${device.Temp};${device.Humidity};${humstat}`;

        case "Temp + Baro":
            return `${device.Temp};${device.Barometer};${device.ForecastStr}`;

        case "Temp + Humidity + Baro":
            return `${device.Temp};${device.Humidity};${humstat};${device.Barometer};${device.ForecastStr}`;
            
        default:
            return undefined;
    }
}

function preParseEnergy(device) {

    switch (device.Type) {
		
		case "Current":
			const values = device.Data.split(',');
			if (values.length == 3) {
				return `${parseFloats(values[0])};${parseFloats(values[1])};${parseFloats(values[2])}`;
			} else {
				return parseFloats(device.Data);
			}

		case "Usage":
			switch (device.SubType) {
				case "Electric":
					return `${parseFloats(device.Data)}`;
			}

		case "P1 Smart Meter":
			switch (device.SubType) {
				case "Energy":
					return `${device.Data}`;

				case "Gas":
					return `${parseFloats(device.Counter)};${parseFloats(device.CounterToday)};${parseFloats(device.price)}`;
					
				default:
					return undefined;
			}

        default:
            return undefined;
		
	}

}

/*
 * END
 */

