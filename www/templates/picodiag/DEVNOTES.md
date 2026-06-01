# Guide: Adding New Cards to the PicoDiag Platform

Follow this structured blueprint to cleanly expand your dashboard layout without creating resource conflicts or breaking your modular design.

---

## Step 1: Define the Device and Add HTML Layout

Create a new layout wrapper inside the main dashboard section of index.html. Use descriptive metadata tags instead of global identity markers.

```html
<!-- ROW 1 BAY X: CUSTOM SENSOR TILE -->
<div class="hmi-pack-card" data-type="custom" data-device-idx="X">
    <div class="hmi-card-header">
        <div class="hmi-pack-label">Custom Label Name</div>
        <div class="hmi-badge">STATUS</div>
    </div>
    <div class="hmi-value-grid">
        <div class="hmi-value-box">
            <!-- Add a clean descriptor class wrapper to handle content text -->
            <span class="hmi-value-custom">--</span>
        </div>
    </div>
</div>
```

---

## Step 2: Add Modular Threshold Logic (JavaScript)

Create a dedicated local function inside your index.html DOMContentLoaded listener. Isolate it completely to protect against global naming conflicts.

```javascript
// Add your unique threshold expression within the DOMContentLoaded wrapper
const checkCustomCardThresholds = (idx, liveValue) => {
    // 1. Locate your distinct card node using a specific combined selector
    const card = document.querySelector(`[data-device-idx="${idx}"][data-type="custom"]`);
    if (!card) return;

    const badge = card.querySelector('.hmi-badge');
    let alarmState = "normal";
    let statusText = "NORMAL";

    // 2. Configure your evaluation boundaries
    if (liveValue >= 50) {
        alarmState = "critical";
        statusText = "ALARM";
    }

    // 3. Write properties back to update elements safely
    card.setAttribute("data-alarm", alarmState);
    if (badge) badge.textContent = statusText;
};
```

---

## Step 3: Create an Asynchronous Network Request

Add an internal data-fetch block inside your script file to download payload objects from the Domoticz database.

```javascript
async function fetchCustomTileData(idx) {
    try {
        // Generate the exact URL string using your global DOMOTICZ_URL variable
        const targetUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=getdevices&rid=${idx}`;
        const response = await fetch(targetUrl);
        if (!response.ok) return;
        const data = await response.json();

        if (data && data.result && data.result[0]) {
            const device = data.result[0];
            
            // Extract target data element
            const liveValue = parseFloat(device.Data) || 0;

            // Target your inner HTML span wrapper
            const card = document.querySelector(`[data-device-idx="${idx}"][data-type="custom"]`);
            if (card) {
                const valueField = card.querySelector('.hmi-value-custom');
                if (valueField) valueField.textContent = `${liveValue} units`;
            }

            // Route to your validation engine
            checkCustomCardThresholds(idx, liveValue);
        }
    } catch (err) {
        console.error(`Failed to update card for device index ${idx}:`, err);
    }
}
```

---

## Step 4: Link to the Unified Background Polling Loop

Register your new network function inside your main update workflow cycle at the bottom of the script.

```javascript
const runUpdateCycle = () => {
    const currentTime = new Date().toLocaleTimeString();
    console.log(`[HMI Polling] [${currentTime}] Requesting fresh diagnostic telemetry data...`);
    
    // Existing functions...
    fetchTrendData(TEMP_IDX, "temp", "°C", chartContainer);
    fetchNetworkRSSI(24);

    // NEW: Register your custom device fetch execution call
    fetchCustomTileData(X); 
};
```

---

## Step 5: Configure Your Stylesheets (hmitiles.css)

Add styling definitions to hmitiles.css to control look and behaviors. Use low-saturation gray shades to match the high-performance ISA-101 theme.

```css
/* Layout rules for custom value blocks */
.hmi-value-custom {
    font-size: 20px;
    font-weight: bold;
    color: #333333;
}

/* Custom Alert Profiles */
.hmi-pack-card[data-alarm="critical"] {
    border-color: #b33c3c !important; /* Desaturated Red */
}
.hmi-pack-card[data-alarm="critical"] .hmi-badge {
    background-color: #b33c3c !important;
    color: #ffffff;
}
```

---

## 🛠️ The Rule of hmitiles.js Summary
* Shared Core: Keep hmitiles.js completely generic. It should only manage sitewide background themes and standard global variables like DOMOTICZ_URL.
* Scoped Execution: Never add page-specific variables, hardcoded indices, or target selectors to hmitiles.js. Keep custom calculations isolated inside your unique index.html layout file.
