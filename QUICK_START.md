# ⚡ Quick Start: Creating a Custom HMITiles Template

This guide walks you through building a brand-new, custom dashboard layout from scratch using the **Domoticz-HMITiles** framework. 

In this example, we will build a simple **2-Tile Grid** that links directly to your running Domoticz server instance:
1. A **Solar Output Tile** (Display-only metric with warning alerts)
2. A **Dimmable Light Slider Tile** (Interactive command control with custom labels)

---

## 🛠️ Step 1: Create Your Domoticz Virtual Devices

Before writing the HTML layout, ensure you have created two virtual dummy devices inside your Domoticz utility hardware panel. Note down their unique **IDX numbers** from your device list:

* **Device 1 (Display Only):** Create an `Electric (Usage)` dummy sensor (e.g., linked to your solar output). Let's assume its ID is **`IDX 40`**.
* **Device 2 (Interactive Slider):** Create a `Light/Switch` dummy sensor and change its type to `Dimmer`. Let's assume its ID is **`IDX 41`**.

---

## 📁 Step 2: Set Up Your Project Folder

To keep your files modular and organized, deploy your new custom template inside your standard Domoticz templates path alongside the shared common styles and engine files:

```text
...domoticz/www/templates/
├── hmitiles.css               # Shared common styling library file
├── hmitiles.js                # Shared common javascript core engine
└── my_custom_dashboard/
    └── index.html             # Your new custom layout file (Created Below)
```

---

## 💻 Step 3: Write the HTML Structure (`index.html`)

Create a new file named `index.html` inside your `my_custom_dashboard/` subfolder, open it in any text editor, and paste the following clean structure. 

Notice how we link backward (`../`) to reuse the shared asset engine files, and use a private `DOMContentLoaded` closure block to protect against global naming collisions across external files:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Custom HMITiles Dashboard</title>
    <!-- 1. Link back to your shared centralized framework assets up one folder level -->
    <link rel="stylesheet" href="../hmitiles.css">
    <script src="../hmitiles.js" defer></script>

    <!-- 2. Bulletproof Page-Scoped Automation Control Engine -->
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            // CONSTANTS: Local script configurations
            const SOLAR_IDX = 40;
            const DIMMER_IDX = 41;
            const WARNING_THRESHOLD = 500.0; // Trigger alert if solar drops below 500W

            // LOCAL FUNCTION: Scoped alarm evaluator isolated from external file overwrites
            const checkSolarThresholds = (idx, currentValue) => {
                const card = document.querySelector(`[data-device-idx="${idx}"][data-type="temperature"]`);
                if (!card) return;

                const badge = card.querySelector('.hmi-badge');
                let state = "normal";
                let badgeText = "NORMAL";

                if (idx === SOLAR_IDX && currentValue < WARNING_THRESHOLD) {
                    state = "warning";
                    badgeText = "LOW GEN";
                }

                card.setAttribute("data-alarm", state);
                if (badge) badge.innerText = badgeText;
            };

            // AUTO-REFRESH & DATA PROCESSING ENGINE LOOP
            const runUpdateCycle = async () => {
                try {
                    // Fetch live device state parameters natively using global DOMOTICZ_URL
                    const response = await fetch(`${DOMOTICZ_URL}/json.htm?type=command&param=getdevices&rid=${SOLAR_IDX}`);
                    if (!response.ok) return;
                    const data = await response.json();

                    if (data && data.result && data.result[0]) {
                        const device = data.result[0];
                        const liveValue = parseFloat(device.Data) || 0;

                        // Execute local alarm evaluations safely
                        checkSolarThresholds(SOLAR_IDX, liveValue);
                    }
                } catch (err) {
                    console.error("Dashboard background pooling sync error:", err);
                }
            };

            // Initialize polling loop (ticks smoothly every 60 seconds)
            runUpdateCycle();
            setInterval(runUpdateCycle, 60000);
        });

        function goToDomoticzDashboard() {
            window.location.href = "../index.html";
        }
    </script>
</head>
<body>

    <header class="hmi-header-container" style="display: flex; align-items: center; padding: 10px 15px;">
        <button class="hmi-exit-btn" onclick="goToDomoticzDashboard()">◀ Main Menu</button>
        <h1 style="margin: 0; padding-left: 15px;">Custom Plant Workspace</h1>
    </header>

    <!-- 3. The common industrial matrix panel grid container layout -->
    <main class="hmi-panel">
        
        <!-- DEVICE 1: DISPLAY ONLY METRIC (Targets specific type/index criteria safely) -->
        <div class="hmi-pack-card hmi-clickable-card" data-type="temperature" data-device-idx="40">
            <div class="hmi-card-header">
                <div class="hmi-pack-label">Solar Output</div>
                <div class="hmi-badge">NORMAL</div>
            </div>
            <div class="hmi-value-grid">
                <div class="hmi-value-box" style="display: flex; align-items: center; justify-content: center; min-height: 40px;">
                    <div class="hmi-box-data">
                        <!-- The common JS loop will automatically pass live strings here -->
                        <span class="hmi-value">--</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- DEVICE 2: INTERACTIVE DIMMER SLIDER (Custom data attributes handle labels natively) -->
        <div class="hmi-pack-card" data-type="dimmer" data-device-idx="41" data-on-text="OPEN" data-off-text="CLOSED">
            <div class="hmi-card-header">
                <div class="hmi-pack-label">Ceiling Light Dimmer</div>
                <div class="hmi-badge">CLOSED</div>
            </div>
            <div class="hmi-value-grid">
                <div class="hmi-value-box" style="display: flex; align-items: center; justify-content: center; min-height: 40px; padding: 0 8px;">
                    <div class="layout-slider" style="display: flex; align-items: center; gap: 8px; width: 100%;">
                        <!-- The slider framework handles live drag changes and dispatches commands instantly -->
                        <input type="range" min="0" max="100" value="0" class="hmi-slider" style="flex: 1;">
                        <div><span class="hmi-dimmer-text">0</span>%</div>
                    </div>
                </div>
            </div>
        </div>

    </main>

</body>
</html>
```

---

## 🔥 Step 4: Run and Test Your Dashboard

1. Save the file.
2. Load your new dashboard page directly through your running Domoticz instance web portal:
   `http://YOUR_DOMOTICZ_IP:8080/templates/my_custom_dashboard/index.html`
3. **Watch it Live:** 
   * The first tile will automatically start parsing the live telemetry numbers from your server every 5 seconds. If values breach limits, boundary colors adapt instantly.
   * Dragging the slider handle on the second tile will immediately broadcast live light adjustment commands back over the Domoticz JSON network API.

---

## 💡 Key Design Best Practices
* **Never Poll Globally:** Keep page-specific thresholds and custom text evaluations out of `hmitiles.js`. Nest them locally using private arrow function expressions.
* **Isolate Selection Queries:** Always combine your selection hooks (`[data-device-idx="40"][data-type="temperature"]`) so your data routines never misidentify chart wrappers or layout modules that share index parameters.
* **Leverage Native Attributes:** Use `data-on-text` and `data-off-text` parameters straight in your HTML block tags to let the core framework translate state expressions dynamically.
