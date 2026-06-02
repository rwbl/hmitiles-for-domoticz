# Quick Start Solar Production with Trend

This quick start outlines how to create 3 HMITiles displaying Solar Production value (W) with 24-hour trend and last data point timestamp.

## Screenshots

![My Cusom Page](images/domoticz-hmitiles-mycustompage-2.png)

---

## Step 1: Create Your Domoticz Virtual Devices

Before writing the HTML layout, ensure you have created a virtual dummy device inside your Domoticz utility hardware panel. Note down their unique **IDX numbers** from your device list:

- **Device 1 (Display Only):** Create an `Electric (Usage)` dummy sensor (e.g., linked to your solar output). Let's assume its ID is **`IDX 5`**.
- **Device 2 (Display Only):** Create and `Text` dummy sensor. Let's assume its ID is **IDX 13**.

---

## Step 2: Set Up Your Project Folder

To keep your files modular and organized, deploy your new custom template inside your standard Domoticz templates path alongside the shared common styles and engine files:

```
...domoticz/www/templates/
├── hmitiles.css               	# Shared common styling library file
├── hmitiles.js                	# Shared common javascript core engine
├── MyCustomPage.html  			# Domoticz custom page wrapper (created below)
└── mycustompage/
    └── index.html             	# Your new custom layout file (created Below)
```

---

## Step 3: Write the HTML Structure (`index.html`)

Create a new file named `index.html` inside your `mycustompage/` subfolder, open it in any text editor, and paste the following clean structure. 

**Notes**
* In the head section there are links backward (`../`) to reuse the shared asset engine files, and use a private `DOMContentLoaded` closure block to protect against global naming collisions across external files.
* Inside header set the title enclosed in <h1>Title</h1> or any other header level.
* In Tile 1 set the device idx according devices list

**Content** `index.html`
```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Custom Page</title>

    <!-- Link backward one folder level to reuse shared global common styles -->
    <link rel="stylesheet" href="../hmitiles.css">
	
	<!-- Link backward to the HMI tile engine -->
    <script src="../hmitiles.js" defer></script>

    <script>
		document.addEventListener("DOMContentLoaded", () => {
			const baseUrl = window.parent && window.parent.$ ? window.parent.$.domoticzurl : window.location.origin;

			// Go over all chart container and feth the trend data
			document.querySelectorAll("[data-chart-idx]").forEach(container => {
				const idx = container.getAttribute("data-chart-idx");
				const sensorType = "counter";
				const unit = "W";

				if (idx) {
					fetchTrendData(idx, sensorType, unit, container);
				}
			});

			// --- NEW TIMESTAMP CAPTURE COUPLING ---
			// Target your text clock holder cell natively
			const timeCard = document.querySelector('[data-device-idx="13"]');
			if (timeCard) {
				fetchTextTimestamp(timeCard, baseUrl);
			}
		});

		/**
		 * Fetches the raw string text history from your text device log channel.
		 */
		async function fetchTextTimestamp(element, baseUrl) {
			try {
				const response = await fetch(`${baseUrl}/json.htm?type=command&param=getdevices&rid=13`);
				if (!response.ok) throw new Error();
				const data = await response.json();

				if (data.result && data.result[0]) {
					const timeField = element.querySelector('.hmi-value');
					// Grabs the exact, formatted text string updated by your dzVents engine script
					if (timeField) {
						timeField.textContent = data.result[0].Data || "--:--:--";
					}
				}
			} catch (err) {
				console.error("Failed to parse text stamp device info:", err);
			}
		}

        async function fetchTrendData(idx, sensor, unit, container) {
            try {
                const targetUrl = `${DOMOTICZ_URL}/json.htm?type=command&param=graph&sensor=${sensor}&idx=${idx}&range=day`;
                
                const response = await fetch(targetUrl);
                if (!response.ok) throw new Error();
                const data = await response.json();

                if (data.result && data.result.length > 0) {
                    const points = data.result.map(item => parseFloat(item.v || item.v_1 || item.u || item.svalue || 0));
                    renderSparkline(container, points, unit);
                } else {
                    container.innerHTML = "<span style='color:#999; font-size:12px;'>No historical logs</span>";
                }
            } catch (err) {
                console.error("Trend load error:", err);
                container.innerHTML = "<span style='color:#ff0000; font-size:12px;'>API Error</span>";
            }
        }

        function renderSparkline(container, dataPoints, unit) {
            const width = 300;
            const height = 100;
            const padding = 5;

            // 1. Calculate the exact Min and Max values from the dataset
            const min = Math.min(...dataPoints);
            const max = Math.max(...dataPoints);
            const range = max - min === 0 ? 1 : max - min;

            const coords = dataPoints.map((val, index) => {
                const x = padding + (index / (dataPoints.length - 1)) * (width - padding * 2);
                const y = (height - padding) - ((val - min) / range) * (height - padding * 2);
                return `${x},${y}`;
            });

            // 2. Generate the layout with the SVG line graph and the text stats row
            container.innerHTML = `
                <div class="hmi-sparkline-svg-wrapper">
                    <svg viewBox="0 0 ${width} ${height}" class="hmi-sparkline-svg" preserveAspectRatio="none">
                        <path class="hmi-trend-line" d="M ${coords.join(' L ')}" />
                    </svg>
                </div>
                <div class="hmi-trend-stats">
                    <div><span class="hmi-stat-label">MIN:</span> ${Math.round(min)}${unit}</div>
                    <div><span class="hmi-stat-label">MAX:</span> ${Math.round(max)}${unit}</div>
                </div>
            `;
        }

        function goToMainDashboard() {
            window.location.href = "index.html";
        }
    </script>

</head>
<body>

	<!-- Inside the header block of index.html -->
	<header class="hmi-header-container">
		<div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
			<div style="display: flex; align-items: center; gap: 15px;">
				<button class="hmi-exit-btn" onclick="goToDomoticzDashboard()">◀ Main Menu</button>
				<h2>My Custom Page</h2>
			</div>
		</div>
	</header>

    <!-- Master outer panel containing your grid -->
    <main class="hmi-panel">
        
        <!-- 
			TILE 1 ROW 1 COL 1: POWER PRODUCTION
			Set the device idx according devices list
			IDX 5
		-->
        <div class="hmi-pack-card hmi-clickable-card" data-device-idx="5" data-alarm="normal">
            <div class="hmi-card-header">
                <div class="hmi-pack-label">Solar Production</div>
                <div class="hmi-badge">NORMAL</div>
            </div>
            <div class="hmi-value-grid">
                <div class="hmi-value-box">
                    <div class="hmi-box-data">
                        <span class="hmi-value">--</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 
			TILE 1 ROW 1 COL 2: POWER PRODUCTION TREND 
			Set the device idx according devices list
			IDX 5
		-->
        <div class="hmi-pack-card">
            <div class="hmi-card-header"><div class="hmi-pack-label">Solar Production (24h)</div></div>
            <div class="hmi-value-grid"><div class="hmi-sparkline-container" data-chart-idx="5">Loading...</div></div>
        </div>

        <!-- 
			TILE 1 ROW 1 COL 3: DATA POINT TIMESTAMP
			Set the device idx according devices list
			IDX 13
		-->
		<div class="hmi-pack-card" data-device-idx="13">
			<div class="hmi-card-header">
				<div class="hmi-pack-label">Last Update</div>
			</div>
			<div class="hmi-value-grid">
				<div class="hmi-value-box">
					<div class="hmi-box-data hmi-time-display">
                        <span class="hmi-value">--:--:--</span>
                    </div>
				</div>
			</div>
		</div>

		<footer class="hmi-footer-version">
			<span>Domoticz-HMITiles v1.0.0-Beta</span>
		</footer>
    </main>
</body>
</html>
```

## Step 4: Create Page wrapper (`MyCustomPage.html`)
Inside the folder `www/templates` create file `MyCustomPage.html` which calls the `index.html` located in the Folder
`www/templates/mycustompage`.

**Content** `MyCustomPage.html`
```
<script>
  window.location.href = "templates/mycustompage/index.html";
</script>
```

## Step 5: Run and Test Your Custom Page

1. Save the file.
2. Refresh the Domoticz Web UI.
3. Goto Tab Custom and select `MyCustomPage'
3. **Watch it Live:** 
   * The tile will automatically start parsing the live data from your server every 60 seconds.
   * Clicking on the tile will show device logging data in a new browser tab.
   * Note: For my tests the Solar Info data is obtained every 5 minutes via a dzVents Automation Script.
4. It is also possible to direct load your new custom page directly through your running Domoticz instance web portal:
   `http://YOUR_DOMOTICZ_IP:8080/templates/MyCustomPage.html`

---

## Key Design Best Practices
* **Never Poll Globally:** Keep page-specific thresholds and custom text evaluations out of `hmitiles.js`. Nest them locally using private arrow function expressions.
* **Isolate Selection Queries:** Always combine your selection hooks (`[data-device-idx="40"][data-type="temperature"]`) so your data routines never misidentify chart wrappers or layout modules that share index parameters.
* **Leverage Native Attributes:** Use `data-on-text` and `data-off-text` parameters straight in your HTML block tags to let the core framework translate state expressions dynamically.

