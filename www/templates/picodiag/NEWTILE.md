# Guide: Creating Multi-Property Icon Tiles (FontAwesome)

Follow this blueprint to build icon-based tiles using FontAwesome, while keeping your interface compliant with high-performance ISA-101 design rules.

---

## 🎨 The ISA-101 Rule for Icons
* Static Colors: Do not use bright green, blue, or yellow icons. Icons must remain a neutral slate gray (#555555) or dark charcoal (#333333) during normal runtime states.
* Saturated Alert Colors: Saturated tones (like amber or dark red) must only appear on borders and badges when an active warning threshold is breached.

---

## Step 1: Add FontAwesome and the HTML Tile Markup

Include the FontAwesome CDN header script inside your `<head>` tags if it is not already loaded. Then, place this clean row layout inside your `index.html` file.

```html
<!-- FontAwesome Loader (Place inside <head> if missing) -->
<link rel="stylesheet" href="https://cloudflare.com">

<!-- ROW X BAY X: ICON TELEMETRY TILE -->
<div class="hmi-pack-card" data-type="icon-tile" data-device-idx="25">
    <div class="hmi-card-header">
        <div class="hmi-pack-label">Enclosure Fan Status</div>
        <div class="hmi-badge">NORMAL</div>
    </div>
    <div class="hmi-value-grid" style="display: flex; align-items: center; justify-content: space-between; padding: 12px; min-height: 50px;">
        
        <!-- NATIVE FONTAWESOME CONTAINER CELL -->
        <div class="hmi-icon-wrapper" style="font-size: 24px; color: #555555; width: 40px; text-align: center;">
            <i class="fa-solid fa-fan"></i>
        </div>
        
        <!-- TEXT METRIC VALUE DISPLAY BOX -->
        <div class="hmi-value-box" style="flex: 1; text-align: right;">
            <div class="hmi-value-display" style="font-size: 20px; font-weight: bold; color: #333333;">--</div>
        </div>
    </div>
</div>
```

---

## Step 2: Add Scoped JavaScript Parsing Logic

Place this fetching function inside your private `DOMContentLoaded` listener block in your `index.html` file.

```javascript
            /**
             * Fetches data for an icon tile, updates the text, and processes states
             */
            async function fetchIconTileData(idx) {
                try {
                    const targetUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=getdevices&rid=${idx}`;
                    const response = await fetch(targetUrl);
                    if (!response.ok) return;
                    const data = await response.json();

                    if (data && data.result && data.result[0]) {
                        const device = data.result[0];
                        
                        // Extract target value properties from the Domoticz database payload
                        const rawDataText = device.Data || device.Status || "OFF";
                        const isDeviceOn = (rawDataText.toUpperCase() === "ON" || parseFloat(device.Level) > 0);

                        // Find your custom icon tile element node safely
                        const card = document.querySelector(`[data-device-idx="${idx}"][data-type="icon-tile"]`);
                        if (card) {
                            // Update display text field
                            const valueDisplay = card.querySelector('.hmi-value-display');
                            if (valueDisplay) {
                                valueDisplay.textContent = isDeviceOn ? "RUNNING" : "STOPPED";
                            }

                            // --- HANDLE INDUSTRIAL ICON ANIMATION / ALERTS ---
                            const iconElement = card.querySelector('.fa-fan');
                            const badge = card.querySelector('.hmi-badge');
                            let alarmState = "normal";
                            let badgeText = "NORMAL";

                            if (iconElement) {
                                if (isDeviceOn) {
                                    // Add native CSS animation properties smoothly on the fly
                                    iconElement.style.animation = "spin 2s linear infinite";
                                    iconElement.style.color = "#333333"; // Active slate color
                                } else {
                                    iconElement.style.animation = "none";
                                    iconElement.style.color = "#777777"; // Passive standby color
                                }
                            }

                            // Optional Threshold Guard: Alert if fan is stopped when it shouldn't be
                            card.setAttribute("data-alarm", alarmState);
                            if (badge) badge.textContent = badgeText;
                        }
                    }
                } catch (err) {
                    console.error(`Failed to execute data sync for icon tile IDX ${idx}:`, err);
                }
            }
```

---

## Step 3: Append the CSS Animation Definitions (`hmitiles.css`)

Add this code snippet to your shared global stylesheet to allow elements to rotate, pulse, or bounce cleanly when active.

```css
/* --- Reusable SVG / FontAwesome Kinematic Framework --- */
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@keyframes pulse-slow {
    0% { opacity: 0.4; }
    50% { opacity: 1.0; }
    100% { opacity: 0.4; }
}

/* Base style layout variables */
.hmi-icon-wrapper i {
    transition: color 0.2s ease, transform 0.2s ease;
}
```

---

## Step 4: Hook into your 60-Second Loop

Simply append the function execution string to your main `runUpdateCycle()` block:

```javascript
const runUpdateCycle = () => {
    const currentTime = new Date().toLocaleTimeString();
    console.log(`[HMI Polling] [${currentTime}] Requesting fresh diagnostic telemetry data...`);
    
    // Existing functions...
    fetchTrendData(TEMP_IDX, "temp", "°C", chartContainer);
    fetchNetworkRSSI(24);

    // NEW MODULE: Poll fan metrics from Domoticz device index 25
    fetchIconTileData(25); 
};
```
