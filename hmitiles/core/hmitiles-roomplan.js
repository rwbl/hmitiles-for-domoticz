/**
 * HMITiles - Roomplan Extension Module
 * Pure ES Module Export with Sorted Roomplan Device Layout Sequence
 * Date: 2026-07-30
 * Author: Robert W.B. Linn (c) MIT
 */

export async function buildRoomplanLayout(panel) {
    const roomplanIdx = panel.getAttribute("data-class-idx");
    if (!roomplanIdx) {
        console.error("[hmitiles-roomplan][E] 'data-class-idx' missing from roomplan panel.");
        panel.innerHTML = `<div class="hmi-error">Configuration Error: Missing Roomplan IDX</div>`;
        return;
    }

    const hostUrl = window.DOMOTICZ_URL || window.location.origin;
    const isDebug = window.DEBUG !== undefined ? window.DEBUG : true;

    try {
        // Step A: Load external mapping templates
        const mapResponse = await fetch('/templates/hmitiles/core/hmitiles-roomplan.json');
        if (!mapResponse.ok) throw new Error(`[hmitiles-roomplan][E] Could not load map database: ${mapResponse.status}`);
        const mapData = await mapResponse.json();
        const templates = mapData.mappings;

        // Step B: Get the device list IN ITS CORRECT CHRONOLOGICAL ROOMPLAN ORDER
        const planUrl = `${hostUrl}/json.htm?type=command&param=getplandevices&idx=${roomplanIdx}`;
        const planResponse = await fetch(planUrl);
        const planData = await planResponse.json();

        if (!planData.result) {
            console.warn(`[hmitiles-roomplan] No devices assigned to Roomplan IDX ${roomplanIdx}`);
            panel.innerHTML = `<div class="hmi-info">No devices found in Roomplan #${roomplanIdx}</div>`;
            return;
        }

        // Store the raw ordered roomplan list array key "result"
        const orderedPlanDevices = planData.result; 

        // Step C: Fetch raw device detailed signatures from Domoticz system targets
        const devicesUrl = `${hostUrl}/json.htm?type=command&param=getdevices&filter=all`;
        const devicesResponse = await fetch(devicesUrl);
        const devicesData = await devicesResponse.json();

        if (!devicesData.result) return;

        // Convert system devices array into a lookup Map keyed by string IDX for fast O(1) matching
        const systemDevicesMap = new Map();
        devicesData.result.forEach(device => {
            systemDevicesMap.set(String(device.idx), device);
        });

        // Step D: Loop over the ROOMPLAN SEQUENCE to keep the exact user-defined order intact
        let tilesHtml = "";
        const trackedDevicesLog = [];

        orderedPlanDevices.forEach(planDev => {
            const currentIdx = String(planDev.devidx);
            const detailedDevice = systemDevicesMap.get(currentIdx);

            if (detailedDevice) {
                // Compile HTML matching the precise roomplan array order
                tilesHtml += parseDeviceToTemplate(detailedDevice, templates);
                
                if (isDebug) {
                    trackedDevicesLog.push({
                        Roomplan_Order_ID: planDev.idx, // Layout slot position
                        Device_IDX: detailedDevice.idx,
                        Name: detailedDevice.Name,
                        Type: detailedDevice.Type
                    });
                }
            } else if (isDebug) {
                console.warn(`[hmitiles-roomplan] Device IDX ${currentIdx} exists in Roomplan #${roomplanIdx} but is missing or unused in system devices list.`);
            }
        });

        // Debugging overview to print out the final chronological sequence timeline matrix
        if (isDebug && trackedDevicesLog.length > 0) {
            console.log("=== [hmitiles-roomplan] RENDER SEQUENCE TIMELINE ORDER ===");
            console.table(trackedDevicesLog);
        }

        // Step E: Swap elements cleanly into the target main parent layout container 
        panel.innerHTML = tilesHtml;

    } catch (error) {
        console.error("[hmitiles-roomplan][E] Pipeline layout serialization failed:", error);
        panel.innerHTML = `<div class="hmi-error">Failed to compile dynamic roomplan panel layout.</div>`;
    }
}

/**
 * Normalizes lookup string properties cleanly to map device profiles into templates.
 * To simplify, all domoticz properties are defined in lowercase in hmitiles-roomplan.json.
 */
function parseDeviceToTemplate(device, templates) {
	// Get type, subtype and switchtype from the domoticz device property.
    const type = (device.Type || "").trim().toLowerCase();
    const subType = (device.SubType || "").trim().toLowerCase();
    const switchType = (device.SwitchType || "").trim().toLowerCase();

	// Get the match from the layout definition
    let match = templates.find(t => 
        (t.type || "").trim().toLowerCase() === type && 
        (t.subtype || "").trim().toLowerCase() === subType && 
        (t.switchtype || "").trim().toLowerCase() === switchType
    );
    
    if (!match) {
        match = templates.find(t => 
            (t.type || "").trim().toLowerCase() === type && 
            (t.subtype || "") === "" && 
            (t.switchtype || "") === ""
        );
    }
    
    if (!match) {
        match = templates.find(t => t.Type === "DEFAULT_FALLBACK");
    }

	// Set the labels with fallback empty string if "labels" is entirely missing from the JSON row
    const targetlabels = match.labels !== undefined ? match.labels : "";

	// Get the HTML definmition which is mandatory else nothing is displayed
    let rawHtml = match.html || "";

    // Only perform regex operations if the specific token actually exists in the template string
    if (rawHtml.includes("{{idx}}")) {
        rawHtml = rawHtml.replace(/{{idx}}/g, device.idx || "");
    }
    if (rawHtml.includes("{{name}}")) {
        rawHtml = rawHtml.replace(/{{name}}/g, device.Name || "");
    }
    if (rawHtml.includes("{{labels}}")) {
        rawHtml = rawHtml.replace(/{{labels}}/g, targetlabels);
    }

    return rawHtml;
}
