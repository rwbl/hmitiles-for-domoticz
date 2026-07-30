/**
 * @file hmitiles.js
 * @brief Core JavaScript engine for the HMITiles-for-Domoticz framework.
 * @date 2026-07-21
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
export const DEBUG = false; 

// Domoticz server URL with two options
// Option 1: Domoticz server (f.e. running on Windows 11 or Raspberry Pi 5 OS Trixie)
const DOMOTICZ_URL = window.parent && window.parent.$ ? window.parent.$.domoticzurl : window.location.origin;
// Option 2: Python simulator (folder tools)
// const DOMOTICZ_URL ="http://127.0.0.1:8080";

// Set refresh rate to 1 minute (60000) minimum for Domoticz
const REFRESH_RATE = 5000;		// Tests
// const REFRESH_RATE = 60000;

// =========================================================================
// IMPORTS
// =========================================================================

// Imports from the preparser: conversion, domoticz helpers
import { parseDigits, parseFloats, decodeBase64, replaceString } from './hmitiles-preparser.js';
import { setTileValue, getUnit, getHistorySensor, preParseDeviceData } from './hmitiles-preparser.js';
import { processDevices } from './hmitiles-processor.js';

// IMPORTANT: Bridge the isolation wall: Expose the helper globally to inline index.html scripts!
// From hmitiles-preparser
window.parseDigits = parseDigits;
window.parseFloats = parseFloats;
window.replaceString = replaceString;
window.getUnit = getUnit;
window.getHistorySensor = getHistorySensor;

// From hmitiles-processor
window.processDevices = processDevices;
window.updateCommunicationsStatus = updateCommunicationsStatus;
window.updateTile = updateTile;

// From this engine
// Expose the logger to the global browser scope
window.addDomoticzLog = addDomoticzLog;

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
// COMMUNICATIONSTATUS
// =========================================================================

/**
 * Toggles a global CSS flag modification on the webpage layout body tag if background communications fail.
 * @function updateCommunicationsStatus
 * @param {boolean} isOnline - Set to true if server answers safely, false if data drops.
 * @returns {void}
 */
export function updateCommunicationsStatus(isOnline) {
    document.body.classList.toggle('hmi-comms-lost', !isOnline);
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
export function updateTile(element, data) {
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

/**
 * Transmits a custom diagnostic log message straight up to the Domoticz system logger.
 * Useful for reporting dashboard initialization faults, missing index payloads, or user events.
 * 
 * @async
 * @function addDomoticzLog
 * @param {Number|String} [level=1] - Domoticz log priority flag: 1=Normal, 2=Warning, 4=Error
 * @param {String} message - The diagnostic payload string text to transmit.
 * @returns {Promise<boolean>} True if accepted by the server engine natively.
 */
export async function addDomoticzLog(level = 1, message) {
    if (!message) return false;

    // Use your global URL configuration safely
    const baseUrl = typeof DOMOTICZ_URL !== 'undefined' ? DOMOTICZ_URL : '';
    const customPrefix = "[HMITiles]";
    
    // Formulate the direct native Domoticz addlogmessage API endpoint parameters
    const targetUrl = `${baseUrl}/json.htm?type=command&param=addlogmessage&level=${level}&message=${encodeURIComponent(customPrefix + " " + message)}`;
	console.log(targetUrl);
	
    try {
        const response = await fetch(targetUrl);
        if (!response.ok) throw new Error(`HTTP network error status: ${response.status}`);
        
        const result = await response.json();
        if (result.status === "OK") {
            // Optional: Automatically trigger a terminal window refresh if log panel is visible
            if (typeof fetchDomoticzServerLogs === 'function') {
                setTimeout(fetchDomoticzServerLogs, 300);
            }
            return true;
        }
        return false;
    } catch (err) {
        console.error("HMITiles logger data entry transmission exception:", err);
        return false;
    }
}

// =========================================================================
// INTEGRATED SPARKLINE RENDERING UTILITIES (TREND GRAPH DAY RANGE)
// =========================================================================

export async function fetchAndRenderChart(device, container) {
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

