# Guide: Creating HMI Custom Pages Using the Ecosystem Hook

Follow this blueprint to integrate advanced telemetry tiles (such as values, virtual text timestamps, and historical trend lines) into your custom dashboards. This guide ensures your pages comply with high-performance HMI design rules and sync perfectly with the core `hmitiles.js` engine without creating conflicting network loops.

---

## ⚠️ Architectural Core Rule: No Separate Loops

**DO NOT** create a separate `window.addEventListener('DOMContentLoaded', ...)` block or secondary polling routines (`setInterval`) inside your custom pages.

### Why separate loops break the system:
1. **Visual Layout Crashing**: The global `hmitiles.js` framework and your local page script will independently execute rendering steps at staggered intervals. This causes active layout elements (like charts or status icons) to render twice, overwrite each other, or get stuck in a frozen "Loading..." state.
2. **Server Overhead**: Running separate timers hammers your Domoticz backend database with duplicate API requests.

Always map your advanced parsing pipelines straight into the centralized **`window.onHMITileProcess`** ecosystem hook.

---

## Step 1: Create HTML Layout Markup

Ensure your card containers use standard structural class layouts, explicit data indexing selectors (`data-device-idx`), and explicit type grouping specifications (`data-type`):

```html
<!-- 1. Active Temperature Metric Card -->
<div class="hmi-pack-card" data-device-idx="22" data-type="temperature">
    <div class="hmi-card-header">
        <div class="hmi-pack-label">Pico Temperature</div>
        <div class="hmi-badge">NORMAL</div>
    </div>
    <div class="hmi-value-grid">
        <div class="hmi-value-display">--</div>
    </div>
</div>

<!-- 2. Independent Historical Trend Line Box -->
<div class="hmi-pack-card">
    <div class="hmi-card-header">
        <div class="hmi-pack-label">24-Hour Trend</div>
    </div>
    <div class="hmi-value-grid">
        <div class="hmi-sparkline-canvas" data-chart-idx="22">Loading...</div>
    </div>
</div>

<!-- 3. Virtual Text Timestamp Display Card -->
<div class="hmi-pack-card" data-device-idx="23">
    <div class="hmi-card-header">
        <div class="hmi-pack-label">Last Updated</div>
    </div>
    <div class="hmi-value-grid">
        <div class="hmi-value-display">--:--</div>
    </div>
</div>

<!-- 4. Network RSSI Signal Strength Card -->
<div class="hmi-pack-card" data-device-idx="24">
    <div class="hmi-card-header">
        <div class="hmi-pack-label">Signal Metrics</div>
    </div>
    <div class="hmi-value-grid">
        <div class="hmi-value-display">-- dBm</div>
    </div>
</div>
```

---

## Step 2: Add Scoped JavaScript Ecosystem Hook

Place this script setup inside the `<head>` section of your dedicated dashboard page. 

*Note: The hook intercept evaluates at the very top of the global data collection sequence inside `hmitiles.js` before standard generic layout filters take place. It returns `false` globally to let the central framework complete any native baseline style decorations smoothly.*

```html
<script>
    // =========================================================================
    // LOCAL CONFIGURATION PARAMETERS
    // =========================================================================
    const TEMP_THRESHOLD_WARNING = 22.0;
    const TEMP_THRESHOLD_CRITICAL = 23.0;

    const TEMP_IDX = 22;
    const TIMESTAMP_IDX = 23;
    const RSSI_IDX = 24;

    // Gateway tracking string to protect background calls from cyclic loops
    let lastPushedTime = "";

    // =========================================================================
    // GLOBAL LIFE-CYCLE OVERRIDE HOOK
    // =========================================================================
    window.onHMITileProcess = function(ignoredTileParam, device, rawValue, displayStatus) {
        const currentIdx = parseInt(device.idx, 10);

        // -----------------------------------------------------------------
        // CASE 1: PROCESSING TEMPERATURE DATA AND TREND LINES
        // -----------------------------------------------------------------
        if (currentIdx === TEMP_IDX) {
            // Find our trend layout target container across the DOM space safely
            const trendContainer = document.querySelector('[data-chart-idx="22"]');
            if (trendContainer) {
                fetchTrendData(TEMP_IDX, "temp", "°C", trendContainer);
            }

            // Find our active text display card to set desaturated HMI color boundaries
            const tempCard = document.querySelector(`[data-device-idx="${TEMP_IDX}"][data-type="temperature"]`);
            if (tempCard) {
                let alarmState = "normal";
                let badgeText = "NORMAL";

                if (rawValue >= TEMP_THRESHOLD_CRITICAL) {
                    alarmState = "critical";
                    badgeText = "CRITICAL";
                } else if (rawValue >= TEMP_THRESHOLD_WARNING) {
                    alarmState = "warning";
                    badgeText = "WARNING";
                }

                tempCard.setAttribute("data-alarm", alarmState);
                const badge = tempCard.querySelector('.hmi-badge');
                if (badge) badge.textContent = badgeText;
            }
            return false; // Let hmitiles.js populate text metrics numbers automatically
        }

        // -----------------------------------------------------------------
        // CASE 2: PROCESSING VIRTUAL TEXT TIMESTAMPS
        // -----------------------------------------------------------------
        if (currentIdx === TIMESTAMP_IDX) {
            const timeCard = document.querySelector(`[data-device-idx="${TIMESTAMP_IDX}"]`);
            if (timeCard) {
                // Class fallback protection sniffs for both common styling setups
                const timeField = timeCard.querySelector('.hmi-value') || timeCard.querySelector('.hmi-value-display');
                if (timeField) {
                    timeField.textContent = device.Data || device.Status || "--:--";
                }
            }
            return false; 
        }

        // -----------------------------------------------------------------
        // CASE 3: PROCESSING NETWORK RSSI SIGNAL CALCULATIONS
        // -----------------------------------------------------------------
        if (currentIdx === RSSI_IDX) {
            const rssiCard = document.querySelector(`[data-device-idx="${RSSI_IDX}"]`);
            if (rssiCard) {
                // Class fallback protection sniffs for both common styling setups
                const rssiField = rssiCard.querySelector('.hmi-value') || rssiCard.querySelector('.hmi-value-display');
                if (rssiField) {
                    rssiField.textContent = `${device.Data || device.Status || "0"} dBm`;
                }
            }
            return false; 
        }

        return false; 
    };

    // =========================================================================
    // BACKGROUND ASYNC LOGIC WORKERS (Untouched Function Scope)
    // =========================================================================
    async function fetchTrendData(idx, sensor, unit, container) {
        try {
            const targetUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=graph&sensor=${sensor}&idx=${idx}&range=day`;
            const response = await fetch(targetUrl);
            if (!response.ok) throw new Error();
            const data = await response.json();

            if (data.result && data.result.length > 0) {
                const points = data.result.map(item => parseFloat(item.te || item.svalue || 0));
                
                if (typeof renderSparkline === 'function') {
                    renderSparkline(container, points, unit);
                }

                const lastItem = data.result[data.result.length - 1];
                const lastTimestamp = lastItem.d; 
                
                if (lastTimestamp) {
                    const timeOnly = lastTimestamp.split(' ')[1] || lastTimestamp;
                    
                    // Loop Gate: Only push updates when a new data point actually shifts status
                    if (timeOnly !== lastPushedTime) {
                        lastPushedTime = timeOnly;
                        await pushTimestampToDevice(TIMESTAMP_IDX, timeOnly);
                    }
                }
            } else {
                container.innerHTML = "<span style='color:#999; font-size:12px;'>No historical logs</span>";
            }
        } catch (err) {
            console.error("Trend load error:", err);
            container.innerHTML = "<span style='color:#ff0000; font-size:12px;'>API Error</span>";
        }
    }

    async function pushTimestampToDevice(idx, timeString) {
        try {
            const updateUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=udevice&idx=${idx}&nvalue=0&svalue=${encodeURIComponent(timeString)}`;
            const response = await fetch(updateUrl);
            
            if (response.ok) {
                // Instantly sync layout interface value on the fly before next server pass
                const timeCard = document.querySelector(`[data-device-idx="${idx}"]`);
                if (timeCard) {
                    const timeField = timeCard.querySelector('.hmi-value') || timeCard.querySelector('.hmi-value-display');
                    if (timeField) {
                        timeField.textContent = timeString;
                    }
                }
            }
        } catch (err) {
            console.error(`Failed to execute background text push to device ${idx}:`, err);
        }
    }

    function goToDomoticzDashboard() {
        window.location.href = "../index.html"; 
    }
</script>
```
