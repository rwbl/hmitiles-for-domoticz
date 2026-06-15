### 🌪️ Wind & Environment Station Matrix Tile

The **Wind Matrix Tile** aggregates comprehensive weather telemetry parameters into a single, high-density, horizontal monitoring card. It parses composite meteorological data values natively to display immediate spatial conditions and quantitative tracking indices simultaneously.

![Wind Tile Layout Preview](your-screenshot-asset-path-here.png) <!-- Optional: Add your layout screenshot asset link here -->

#### ✨ Key Features
* **Engine Native Integration**: Runs smoothly out-of-the-box using custom string segmentation parsing logic, eliminating layout rendering overhead or dependencies.
* **ISA-101 Performance Optimization**: Elevates scanning readability by shifting engineering units below bold, mathematically rounded integer values.
* **Dynamic Warning Matrix**: Monitors raw wind speeds (m/s) to dynamically calculate Beaufort scale force indexes (F0–F12) and toggle conditional, high-contrast visual alarm badges (`STRONG WIND` / `STORM WARNING`).

---

#### 🛠️ HTML Framework Blueprint

Add this structural layout matrix block to your dashboard template file:

```html
<!-- WIND MONITORING STATION MATRIX COMPONENT -->
<div class="hmi-pack-card" data-type="wind" data-device-idx="45">
    
    <div class="hmi-card-header">
        <div class="hmi-pack-label">Wind</div>
        <div class="hmi-badge hmi-alarm-state wind-alert-badge" style="display: none;">STORM WARNING</div>
    </div>

    <div class="hmi-wind-grid">
        
        <div class="hmi-wind-columns">
            
            <!-- Column 1: Base Speed Metrics -->
            <div class="hmi-wind-col-split">
                <span class="hmi-wind-label">Speed</span>
                <span class="hmi-wind-val-line wind-speed-kmh">0</span>
                <span class="hmi-wind-subvalue wind-speed-ms">(0 m/s)</span>
            </div>

            <!-- Column 2: Gust Scale -->
            <div class="hmi-wind-col-split">
                <span class="hmi-wind-label">Gust</span>
                <span class="hmi-wind-val-line gust-color wind-gust-kmh">0</span>
                <span class="hmi-wind-subvalue">km/h</span>
            </div>

            <!-- Column 3: Windchill Index -->
            <div class="hmi-wind-col-split">
                <span class="hmi-wind-label">Chill</span>
                <span class="hmi-wind-val-line chill-color wind-chill-temp">0</span>
                <span class="hmi-wind-subvalue">°C</span>
            </div>

            <!-- Column 4: Ambient Air Temperature -->
            <div class="hmi-wind-col">
                <span class="hmi-wind-label">Temp</span>
                <span class="hmi-wind-val-line wind-air-temp">0</span>
                <span class="hmi-wind-subvalue">°C</span>
            </div>

        </div>

        <!-- Lower Spatial Layout Status Area Row Tracking -->
        <div class="hmi-wind-status-bar">
            <span class="hmi-wind-bf-desc wind-bf-value-desc">F0 - Calm</span> 
            <span class="hmi-wind-divider">•</span>
            <span class="hmi-wind-direction wind-direction-cardinal">Direction: N (0°)</span>
        </div>

    </div>
</div>
```

---

#### 🎨 CSS Stylesheet Integration (`hmitiles.css`)

Append this layout configuration script rule to your stylesheet file to remove unnecessary inline attributes and enforce rigid horizontal spacing guidelines:

```css
/* =========================================================================
   HMITILES: WIND MATRIX PANEL BLUEPRINT (ISA-101 COMPLIANT)
   ========================================================================= */
.hmi-wind-grid {
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
    padding: 12px 10px 4px 10px; 
}
.hmi-wind-columns {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    width: 100%;
    text-align: center;
}
.hmi-wind-col { display: flex; flex-direction: column; }
.hmi-wind-col-split { display: flex; flex-direction: column; border-right: 1px solid #eee; }
.hmi-wind-label { font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase; }
.hmi-wind-val-line { font-weight: bold; color: #111; margin-top: 4px; }
.hmi-wind-subvalue { font-size: 11px; color: #777; margin-top: 1px; }
.gust-color { color: #d35400; }
.chill-color { color: #2980b9; }
.hmi-wind-status-bar { border-top: 1px solid #eee; margin-top: 12px; padding-top: 8px; text-align: center; font-size: 12px; font-weight: 600; color: #333; }
.hmi-wind-bf-desc { color: #222; font-weight: bold; text-transform: uppercase; margin-right: 6px; }
.hmi-wind-divider { color: #bbb; font-weight: normal; margin-right: 6px; }
.hmi-wind-direction { color: #555; }
```

---

#### ⚙️ Domoticz Core Data Format Routing

This module parses the standard semicolon-delimited input data stream payload format returned by Domoticz wind device types (`WB;WD;WS;WG;22;24` maps out directly to *Bearing, Direction, Speed, Gust, Temperature, Windchill*):

```javascript
// Inside your global device loop routing engine interface tracker:
if (device.Type === 'Wind') {
    // Passes device name, target token elements, and the data string payload safely
    updateWindTile(tileElement, device.Data || "0;N;0;0;0;0", device.Name);
    return;
}
```
