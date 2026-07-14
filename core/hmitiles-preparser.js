/**
 * @file hmitiles-preparser.js
 * @brief Core Normalization & Feature Extraction Layer
 * @date 2026-07-12
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
 * Utility to extract floating-point decimals safely from strings (e.g., "0.0000 kWh" -> "0.0000")
 * @param {string|number} str - The raw incoming text or data from Domoticz.
 * @param {number} [decimalPlaces] - Optional precision padding to force trailing zeros.
 * @returns {number|string} True float value, or precision string if decimalPlaces is provided.
 */
export function parseFloats2(str, decimalPlaces = null) {
    if (str === undefined || str === null || str === "") return decimalPlaces !== null ? (0).toFixed(decimalPlaces) : 0.0;
    
    // Captures negative, positive, integer, and decimal notation structures perfectly
    const matches = String(str).match(/[-+]?[0-9]*\.?[0-9]+/);
    if (!matches) {
        return decimalPlaces !== null ? (0).toFixed(decimalPlaces) : 0.0;
    }
    
    const parsedNum = parseFloat(matches[0]);
    
    // THE FIX: If the user requests specific precision decimals, enforce it via toFixed()
    if (decimalPlaces !== null) {
        return parsedNum.toFixed(decimalPlaces); // Returns "0.0000" safely as a string
    }
    
    return parsedNum; // Falls back to native floating-point primitives for standard math checks
}

/**
 * Utility to extract floating-point decimals safely from strings (e.g., "23.5 C" -> 23.5)
 */
export function parseFloats(str) {
    if (!str) return 0.0;
    const matches = String(str).match(/[-+]?[0-9]*\.?[0-9]+/);
    return matches ? parseFloat(matches[0]) : 0.0;
}

/**
 * Safely decodes Base64 strings sent by Domoticz APIs (e.g. for Selector LevelNames)
 */
export function decodeBase64(str) {
    if (!str) return "";
    try {
        // atob() is the standard web API to decode Base64 data strings natively
        return atob(str.trim());
    } catch (e) {
        console.warn("Base64 string decoding skipped/failed:", e);
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

/* ================================
 * UTILITY DOMOTICS FUNCTIONS
 * ================================ */

/**
 * Translates Domoticz Type and SubType configurations into precise string suffixes.
 * Fully compatible with single-value sensors and multi-device matrix structures.
 * Resolves the appropriate measurement unit suffix based on semantic device profiles.
 * Intelligently auto-discovers units from raw value string suffixes first, then
 * uses semantic fallback cascades for complex multi-value or raw text devices.
 * 
 * @param {Object} device - The active target Domoticz device data block object.
 * @returns {String} The structural measurement suffix label string.
 */
export function getUnit(device) {
    // Fail-safe initialization fallback default
    if (!device || device.Data === undefined || device.Data === null) return "°C";
    
    const rawDataStr    = String(device.Data).trim();
    const deviceType    = String(device.Type || "");
    const deviceSubType = String(device.SubType || "");

    // =========================================================================
    // PHASE 1: AUTOMATIC REAL-TIME SUFFIX DISCOVERY (TYPE 2 HIGHEST PRIORITY)
    // If the device data is a single value containing spaces and trailing text,
    // natively grab the exact unit string sent straight from the API!
    // Catches: "123.4 cm", "0 l/min", "10.3 km", "0 V", "65 dB", "0.0 Bar", "0 Lux"
    // =========================================================================
    if (!rawDataStr.includes(';') && rawDataStr.includes(' ')) {
        const spaceParts = rawDataStr.split(/\s+/);
        const trailingWord = spaceParts[spaceParts.length - 1].trim();
        
        // Block out UI state labels (like "Set Level:", "Off", or "On") from becoming units
        if (trailingWord !== "%" && isNaN(parseFloat(trailingWord)) && 
            !rawDataStr.includes("Set Level") && trailingWord !== "On" && trailingWord !== "Off") {
            return trailingWord;
        }
    }

    // =========================================================================
    // PHASE 2: SEMANTIC HARDCODED MATRIX MATCHING
    // Fallback gates for Multi-Values, Un-suffixed Primitives, and Switches.
    // =========================================================================
    
    // 1. CLIMATE TEMPERATURE NETWORKS
    if (deviceType.includes("Temp") || deviceType === "Temperature" || deviceType === "Setpoint") {
        return "°C";
    }
    
    // 2. CAPACITY & METRIC LEVEL READOUTS
    if (deviceType === "Humidity" || deviceSubType === "Percentage" || rawDataStr.includes("%")) {
        return "%";
    }
    
    // 3. MULTI-VALUE WEATHER METRICS
    if (deviceType === "Wind") {
        return "m/s"; // International standard wind velocity baseline notation
    }
    if (deviceType === "Rain") {
        return "mm";  // Liquid accumulation depth standard
    }
    if (deviceSubType === "Soil Moisture") {
        return "cb";  // Centibars soil tension metric
    }
    if (deviceType === "UV") {
        return "UVI"; // Ultraviolet index scale marker
    }
    if (deviceType === "Wind") {
        return "Bft"; // Default to bft (need to set in the Domoticz settings
    }

    // POWER, ENERGY & ACCUMULATED GENERATION
    if (deviceType === "Usage" || deviceSubType === "Electric" || deviceSubType === "Custom Watts Sensor") {
        return "W";
    }
    if (deviceSubType === "kWh" || deviceType.includes("Energy") || deviceType === "P1 Smart Meter") {
        // Distinguish the gas loop sub-channel index from primary electric logs
        if (deviceSubType === "Gas") return "m³";
        return "kWh";
    }

    // METEOROLOGICAL BAROMETRIC PRESSURE DATA
    if (deviceSubType === "Barometer" || deviceType.includes("Baro")) {
        return "hPa";
    }

	// Safe controls and informational text cards bypass unit markings completely

    // MULTI-PHASE CURRENT AMPLITUDE READS
    if (deviceType === "Current") {
        return "A";
    }

    // Light/Switch
    if (deviceType === "Light/Switch" || deviceSubType === "Switch") {
        return ""; 
    }

    // Text
    if (deviceSubType === "Text") {
        return ""; 
    }

    // Quiet baseline system fallback cushion
    return "";
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

    // 1. Core threshold index lookup (Pure numeric execution loop)
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
    // 2. THE ADAPTIVE STATE ROUTER (DYNAMIC CHROMATIC SCALE MATCHING)
    // Maps your matched index slot to your 4px CSS classes based on array length!
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

    // Write the clean color modifier attribute straight onto your tile element chassis
    tileElement.setAttribute("data-alarm", activeClassStr);
    
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
 * Safely extracts a space-separated string ("VALUE UNIT") into a standardized semicolon row.
 * 
 * @param {String} rawData - The raw telemetry data string (e.g., "123.4 cm", "0 l/min").
 * @param {String} fallbackUnit - Default unit suffix used if the string lacks trailing text.
 * @returns {String} Standardized structural string format: "VALUE;UNIT"
 */
function parseSingleValue(device, fallbackUnit = "") {
	const rawData = device.Data;
    const cleanString = String(rawData || "").trim();
    if (!cleanString) return `0;${fallbackUnit}`;

    // Tokenize text segments cleanly by removing all consecutive spaces pass holes
    const parts = cleanString.split(/\s+/);
    
    // Extract numbers safely using your framework's native parsing helper
    const isolatedValue = typeof parseFloats === "function" ? parseFloats(parts[0]) : parseFloat(parts[0]) || 0;
    
    // Read the suffix from parts index 1, falling back smoothly to your default unit parameter
    const isolatedUnit = parts.length > 1 ? parts[1].trim() : fallbackUnit;

	// Set the custom properties
	device.tileValue = isolatedValue;
	device.tileUnit = isolatedUnit;
	// tile.State done in processTileStateAndAlarm
	
    return `${isolatedValue};${isolatedUnit}`;
}

/**
 * Main orchestration function for device preprocessing and payload standardization.
 * 
 * @param {Object} device - The shared Domoticz device data reference object.
 * @param {HTMLElement} tileElement - The active target HTML DOM card chassis component.
 */
/**
 * Master Pre-Parser Entry Point.
 * Standardizes raw Domoticz values and executes your real-time alarm thresholds.
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
        
        // Re-pack metrics into your standard semicolon row to feed columns perfectly
        device.Data = `${currentNumericVal};${evaluation.text}`;
        return;
    }

    device.Data = csvPayload;
}

/**
 * Hardware Exclusion Filter Matrix.
 * Explicitly breaks irregular hardware variations down into unified semicolon rows.
 * 
 * @param {Object} device - The raw incoming Domoticz device data block reference.
 * @param {HTMLElement} tileElement - The active host layout chassis node.
 * @returns {Boolean} Returns true if a signature matched and handled the payload.
 * @todo
 * Device Fan
 */
function preParseDevices(device, tileElement) {
    let csvPayload = undefined;

    // =========================================================================
    // 1. COMPOUND TYPE SELECTIONS (UNCHANGED, FROZEN ARCHITECTURE)
    // =========================================================================
    if (device.Type === "Temp + Humidity") {
        const humstat = device.HumidityStatus === "Comfortable" ? "COMF" : device.HumidityStatus;
        csvPayload = `${device.Temp};${device.Humidity};${humstat}`;
    }
    else if (device.Type === "Temp + Baro") {
        csvPayload = `${device.Temp};${device.Barometer};${device.ForecastStr}`;
    }
    else if (device.Type === "Temp + Humidity + Baro") {
        const humstat = device.HumidityStatus === "Comfortable" ? "COMF" : device.HumidityStatus;
        csvPayload = `${device.Temp};${device.Humidity};${humstat};${device.Barometer};${device.ForecastStr}`;
    }


    else if (device.Type === "General" && device.SubType === "Barometer") {
        csvPayload = `${device.Barometer};${device.ForecastStr}`;
    }
    else if (device.Type === "General" && device.SubType === "Managed Counter") {
        csvPayload = `${parseFloats(device.counter)};${parseFloats(device.Data)}`;
    }

    // =========================================================================
    // 2. TARGETED UTILITY DEPLOYMENT FOR SINGLE-VALUE DEVICES WITH SPACE SUFFIXES
    // =========================================================================
    else if (device.Type === "General" && device.SubType === "Custom Sensor") {
        // Converts "123.4 unit" -> "123.4;unit"
        csvPayload = parseSingleValue(device, "");
    }
    else if (device.Type === "General" && device.SubType === "Distance") {
        // Converts "123.4 cm" -> "123.4;cm"
        csvPayload = parseSingleValue(device, "cm");
    }
    else if (device.Type === "General" && device.SubType === "Pressure") {
        // Converts "250 Bar" -> "250;Bar"
        csvPayload = parseSingleValue(device, "Bar");
    }
    else if (device.Type === "General" && device.SubType === "Sound Level") {
        // Converts "65 dB" -> "65;dB"
        csvPayload = parseSingleValue(device, "dB");
    }
    else if (device.Type === "General" && device.SubType === "Visibility") {
        // Converts "10.3 km" -> "10.3;km"
        csvPayload = parseSingleValue(device, "km");
    }
    else if (device.Type === "General" && device.SubType === "Waterflow") {
        // Converts "0 l/min" -> "0;l/min"
        csvPayload = parseSingleValue(device, "l/min");
    }
    else if (device.Type === "General" && device.SubType === "Leaf Wetness") {
        // Converts "250" -> "250;0=dry,100=wet"
        csvPayload = parseSingleValue(device, "lux");
    }
    else if (device.Type === "Lux" && device.SubType === "Lux") {
        // Converts "250 Lux" -> "250;Lux"
        csvPayload = parseSingleValue(device, "lux");
    }
    else if (device.Type === "General" && device.SubType === "Soil Moisture") {
        // Converts "250 cb" -> "250;cb"
        csvPayload = parseSingleValue(device, "cb");
    }
    else if (device.Type === "General" && device.SubType === "Solar Radiation") {
        // Converts "250 Watt/m2" -> "250;Watt/m2"
        csvPayload = parseSingleValue(device, "Watt/m2");
    }
    else if (device.Type === "General" && device.SubType === "Voltage") {
        // Converts "250 V" -> "250;V"
        csvPayload = parseSingleValue(device, "V");
    }
    else if (device.Type === "Usage" && device.SubType === "Electric") {
        // Converts "250 Watt" -> "250;Watt"
        csvPayload = parseSingleValue(device, "W");
    }
    else if (device.Type === "UV") {
        // Converts "250 UVI" -> "250;UVI"
        csvPayload = parseSingleValue(device, "UVI");
    }
    else if (device.Type === "Weight" && device.SubType === "BWR102") {
        // Converts "250 kg" -> "250;kg"
        csvPayload = parseSingleValue(device, "kg");
    }
    else if (device.Type === "Air Quality" && device.SubType === "Voc") {
        // Converts "250 ppm" -> "250;ppm"
        csvPayload = parseSingleValue(device, "ppm");
    }
    else if (device.Type === "Rain" && device.SubType === "TFA") {
		// Type Rain, SubType TFA
		// Normalizes multi-value precipitation records into a clean data contract row
        // Converts "100 mm, 200 mm" or "100, 200" -> "100;200" safely!
        const rawInput = String(device.Data || "0, 0");
        const items = rawInput.split(',');
        
        // Extract numbers using your framework's native parsing helper
        const rainRate  = typeof parseFloats === "function" ? parseFloats(items[0]) : parseFloat(items[0]) || 0;
        const rainTotal = typeof parseFloats === "function" ? parseFloats(items[1]) : parseFloat(items[1]) || 0;
        
        csvPayload = `${rainRate};${rainTotal}`;
    }

    // =========================================================================
    // 3. OTHER EXPLICIT HISTORICAL CHANNELS & TEXT SHIELDS
    // =========================================================================
    
    // Type General, SubType Alert
    // Automatically extracts the native hardware alarm level index (0-4) 
    // and maps it straight onto color border classes!
    else if (device.Type === "General" && device.SubType === "Alert") {
        csvPayload = String(device.Data).trim();
        
        let alertLevelStr = "gray";
        
        // Explicitly map the integer level (0-4) cleanly using structured execution tracks
        switch (parseInt(device.Level, 10)) {
            case 0:
                alertLevelStr = "gray";
                break;
            case 1:
                alertLevelStr = "green";
                break;
            case 2:
                alertLevelStr = "yellow";
                break;
            case 3:
                alertLevelStr = "orange";
                break;
            case 4:
                alertLevelStr = "red";
                break;
            default:
                alertLevelStr = "gray";
                break;
        }
        
        // Inject the color modifier tag directly onto the tile element chassis!
        tileElement.setAttribute("data-alarm", alertLevelStr);
		// csvPayload = `${device.Level};${device.Data}`;
    }
    else if (device.Type === "General" && device.SubType === "Text") {
        csvPayload = device.Data;
    }
    else if (device.Type === "General" && device.SubType === "Percentage") {
        csvPayload = `${parseFloats(device.Data)};%`;
    }
    else if (device.Type === "Light/Switch" && device.SubType === "Switch" && device.SwitchType == "Dimmer") {
        csvPayload = device.Data;
    }
    else if (device.Type === "Current") {
        const values = device.Data.split(',');
        if (values.length == 3) {
            csvPayload = `${parseFloats(values[0])};${parseFloats(values[1])};${parseFloats(values[2])}`;
        } else {
            csvPayload = parseSingleValue(device, "A");
        }
    }

    // If there is a compiled csvPayload, update device.Data and return true
    if (csvPayload) {
        device.Data = csvPayload;
        return true;
    } else {
        return false;
    }
}

/*
 * END
 */

