# Hints

## Page Header
The default page header used for all blueprint and examples.
Replace `MYTITLE` with your page title.
In addition set the title level (default H2).
```
<!-- Inside the header block of your sub-pages (e.g., alarmtile/index.html) -->
<header class="hmi-header-container">
	<div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
		<div style="display: flex; align-items: center; gap: 15px;">
			<button class="hmi-exit-btn" onclick="goToDomoticzDashboard()">&#9664; Main Menu</button>
			<h2>HMITiles Values</h2>
		</div>
		<div>
			<button class="hmi-exit-btn" onclick="goToHMITilesIndex()">HMITiles Index &#9654;</button>
		</div>
	</div>
</header>
```

## Tile Mockup
The universal hmitiles component core markup.
```
<div class="hmi-pack-tile hmi-clickable-tile" 
	data-type="value" 
	data-device-idx="2"
	data-labels="0:VALUE:UNIT">
	<div class="hmi-tile-header"><div class="hmi-pack-label">Custom Sensor</div></div>
	<div class="hmi-value-grid"></div>
</div>
```

## Show Device Property Last Update

In HTML add:
```
<div class="hmi-last-update"></div>
```

Example Tile:
```
<div class="hmi-pack-tile hmi-clickable-tile" 
	data-type="value" 
	data-device-idx="2"
	data-labels="0:VALUE:UNIT">
	<div class="hmi-tile-header"><div class="hmi-pack-label">Custom Sensor</div></div>
	<div class="hmi-value-grid"></div>
	<div class="hmi-last-update"></div>
</div>
```

## Show Device Last Value

In HTML add:
```
<div class="hmi-last-value"></div>
```

Example Tile:
```
<div class="hmi-pack-tile hmi-clickable-tile" 
	data-type="value" 
	data-device-idx="2"
	data-labels="0:VALUE:UNIT">
	<div class="hmi-tile-header"><div class="hmi-pack-label">DEVICE</div></div>
	<div class="hmi-value-grid"></div>
	<div class="hmi-last-value"></div>
	<div class="hmi-last-update"></div>
</div>
```

### Hiding Elements
To hide **do not remove the elements from the HTML definition**. 
Instead, hide them using inline styles or CSS rules. This keeps the core JavaScript event triggers from breaking.

*Example (Hiding Badge):*
```html
<div class="hmi-badge" style="display: none;"></div>
```

*Example (Hiding Input Row Elements):*
```html
<div class="hmi-log-input-row" style="justify-content: flex-end;">
    <input type="text" class="hmi-log-input" placeholder="Type custom log message..." maxlength="100" style="display: none;">
    <button class="hmi-log-send-btn" style="display: none;">SEND</button>
    <button class="hmi-log-clear-btn">CLEAR</button>
</div>
```

## Force using Value-Box Value
Set class in hmi-box-data to empty:
```
<div class="hmi-value-grid">
	<div class="hmi-value-box">
		<div class="hmi-box-data">
			<!-- No class to use the text defined --->
			<span class="">EMERGENCY STOP</span>
		</div>
	</div>
</div>
```
