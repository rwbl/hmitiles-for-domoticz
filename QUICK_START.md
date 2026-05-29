# ⚡ Quick Start: Creating a Custom HMITiles Template

This guide walks you through building a brand-new, custom dashboard layout from scratch using the **Domoticz-HMITiles** framework. 

In this example, we will build a simple **2-Tile Grid** that links directly to your running Domoticz server instance:
1. A **Solar Output Tile** (Display-only metric)
2. A **Dimmable Light Slider Tile** (Interactive command control)

---

## 🛠️ Step 1: Create Your Domoticz Virtual Devices

Before writing the HTML layout, ensure you have created two virtual dummy devices inside your Domoticz utility hardware panel. Note down their unique **IDX numbers** from your device list:

* **Device 1 (Display Only):** Create an `Electric (Usage)` dummy sensor (e.g., linked to your solar output). Let's assume its ID is **`IDX 40`**.
* **Device 2 (Interactive Slider):** Create a `Light/Switch` dummy sensor and change its type to `Dimmer`. Let's assume its ID is **`IDX 41`**.

---

## 📁 Step 2: Set Up Your Project Folder

To keep your files modular and organized, deploy your new custom template inside your standard Domoticz templates path alongside the shared common styles and engine files [INDEX]:

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

Notice how we link backward (`../`) to reuse the shared asset engine files [INDEX]:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Custom HMITiles Dashboard</title>
    <!-- 1. Link back to your shared centralized framework assets up one folder level -->
    <link rel="stylesheet" href="../hmitiles.css">
    <script src="../hmitiles.js" defer></script>
</head>
<body>

    <header class="hmi-header-container">
        <div style="display: flex; align-items: center; gap: 15px;">
            <button class="hmi-exit-btn" onclick="goToDomoticzDashboard()">◀ Main Menu</button>
            <h1>Custom Plant Workspace</h1>
        </div>
    </header>

    <!-- 2. The common industrial matrix panel grid container layout -->
    <main class="hmi-panel">
        
        <!-- DEVICE 1: DISPLAY ONLY METRIC (Change data-device-idx to match your device) -->
        <div class="hmi-pack-card hmi-clickable-card" data-device-idx="40" data-alarm="normal">
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

        <!-- DEVICE 2: INTERACTIVE DIMMER SLIDER (Change data-device-idx to match your device) -->
        <div class="hmi-pack-card" data-type="dimmer" data-device-idx="41">
            <div class="hmi-card-header">
                <div class="hmi-pack-label">Ceiling Light Dimmer</div>
                <div class="hmi-badge">OFF</div>
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
   * The first tile will automatically start parsing the live telemetry numbers from your server every 5 seconds [INDEX].
   * Dragging the slider handle on the second tile will immediately broadcast live light adjustment commands back over the Domoticz JSON network API [INDEX].

---

## 💡 Key Design Best Practices
* **Keep HTML Clean:** Never introduce inline event handlers (like `onclick`) or static unit texts (like `W` or `%`) into your values spans [INDEX]. Let the generic JavaScript engine pass the string data cleanly.
* **Leverage Attributes:** Always match your cards to the framework core features by specifying `data-device-idx="..."` and `data-type="dimmer"` or `data-type="switch"` explicitly [INDEX].
