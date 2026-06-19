### 🍃 Indoor Air Quality & 5-Level Alarm Matrix Tile

The **Indoor Air Quality Tile** leverages an advanced, generic **5-Level Alarm Severity Matrix** (`Info`, `Low`, `Medium`, `High`, `Critical`) to monitor environmental parameters. 
By driving all threshold boundaries and status strings entirely through HTML data attributes, the implementation remains 100% generic, reusable, and free from hardcoded sensor logic.

![Indoor Air Quality Tile](indoorairqualitytile.png)

#### ✨ Key Features
* **100% Generic Utility**: Zero sensor-specific or air quality terminology exists inside the JavaScript engine. The layout adapts to any numeric device tracking multi-stage bounds.
* **ISA-101 High-Performance Compliance**: Suppresses noisy alert colors during peaceful conditions while automatically shifting text states and activating high-contrast warning bars (`hmi-warning-state` / `hmi-alarm-state`) during threshold transitions.
* **Extensible Architecture**: This single component layout functions as an instant blueprint for water tank depths, grid voltages, or server temperatures by changing metadata flags.

---

#### 🛠️ HTML Template Configuration

Add this structural tile layout to your dashboard framework template file. All operational behavior and text output layers are driven dynamically from the custom data variables:

```html
<!-- AIR QUALITY MONITOR / 5-LEVEL SEVERITY MATRIX ALARM TILE -->
<div class="hmi-pack-card" data-device-idx="31" 
	data-alarm-type="up"
	data-level-info="0"        data-text-info="EXCELLENT"	data-state-info="normal"
	data-level-low="700"       data-text-low="GOOD"         data-state-low="normal"
	data-level-medium="900"    data-text-medium="FAIR"      data-state-medium="normal"
	data-level-high="1100"     data-text-high="MEDIOCRE"    data-state-high="warning"
	data-level-critical="1600" data-text-critical="BAD"     data-state-critical="critical"
	data-text-normal="NORMAL">
	<div class="hmi-card-header">
		<div class="hmi-pack-label">Air Quality Monitor</div>
		<div class="hmi-badge hmi-clickable-badge">EXCELLENT</div>
	</div>
	<div class="hmi-value-grid">
		<div class="hmi-value-box">
			<div class="hmi-box-data">
				<span class="hmi-value">--</span>
			</div>
		</div>
	</div>
</div>
```

---

