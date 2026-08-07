/**
 * HMITiles - Device List Tile Component Extension Module
 * Pure ES Module Export — Refactored to act as a standalone modular tile component
 */

/**
 * Fetches Domoticz devices and compiles a high-density HTML row list.
 * @returns {Promise<string>} The structured HTML layout string.
 */
/**
 * Fetches Domoticz devices and compiles a high-density HTML row list.
 * @param {string|null} filterKeyword - Optional string text to filter devices by name.
 * @returns {Promise<string>} The structured HTML layout string.
 */
export async function buildDevicesList(filterKeyword = null) {
    const hostUrl = window.DOMOTICZ_URL || window.location.origin;
    
    try {
        const url = `${hostUrl}/json.htm?type=command&param=getdevices&used=true`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Devices API error: ${response.status}`);
        
        const data = await response.json();
        if (!data.result || data.result.length === 0) {
            return `<div class="hmi-info">No devices found.</div>`;
        }

        let listHtml = "";
        let matchingCount = 0;
        
        // Normalize filter query text to lowercase if present
        const searchPhrase = filterKeyword ? filterKeyword.trim().toLowerCase() : null;

        data.result.forEach(device => {
            const name = device.Name || "Unknown Device";
            const currentData = device.Data || "";
            const idx = device.idx;

            // Apply case-insensitive filtering condition if requested
            if (searchPhrase && !name.toLowerCase().includes(searchPhrase)) {
                return; // Skip this device record
            }

            matchingCount++;

            listHtml += `
                <div class="hmi-device-row" data-device-idx="${idx}">
                    <span class="hmi-device-name">${name}</span>
                    <span class="hmi-device-data">${currentData}</span>
                </div>
            `;
        });

        // Safe fallback text if a filter matches absolutely nothing
        if (matchingCount === 0) {
            return `<div class="hmi-info">No devices matching "${filterKeyword}".</div>`;
        }

        return listHtml;

    } catch (error) {
        console.error("[hmitiles-devices][E] Layout compilation failed:", error);
        return `<div class="hmi-error">Failed to load device listing entries.</div>`;
    }
}
