# Hints

## Page Header
The default page header used for all blueprint and examples.
Replace `MYTITLE`with your page title.
In addition set the title level (default H2).
```
<!-- Inside the header block of your sub-pages (e.g., alarmtile/index.html) -->
<header class="hmi-header-bar">
	<!-- Left Sector Group -->
	<div class="hmi-header-left-group">
		<button class="hmi-exit-btn" onclick="goToDomoticzDashboard()">&#9664; Main Menu</button>
		<h2 class="hmi-header-title">
			MYTITLE
		</h2>
	</div>
	
	<!-- Right Sector Group -->
	<div class="hmi-header-right-group">
		<button class="hmi-exit-btn" onclick="goToHMITilesIndex()">HMITiles Index &#9654;</button>
	</div>
</header>
```


## Tile Mockup
```
<!-- THE UNIVERSAL HMITILES COMPONENT CORE MARKUP -->
<div class="hmi-pack-card" data-device-idx="5">
    <div class="hmi-card-header">
        <!-- Element 1: Static Title Box Label -->
        <div class="hmi-pack-label">Solar Power</div>
        
        <!-- Element 2: Static or Alarm-Driven Custom Text Badge -->
        <div class="hmi-badge">PRODUCTION</div>
    </div>
    <div class="hmi-value-grid">
        <div class="hmi-value-box">
            <!-- Element 3: Universal Dynamic Value Target -->
            <span class="hmi-value">-- Watt</span>
        </div>
    </div>
</div>
```

## Show Device Property Last Update

In HTML add:
```
<div class="hmi-last-update" data-text="static">
	<span class="hmi-value-update" data-field="LastUpdate">YYYY-MM-DD hh:mm:ss</span>
</div>
```

Example Tile:
```
<div class="hmi-pack-card hmi-clickable-card" data-device-idx="5" data-alarm="normal">
	<!-- Header -->
	<div class="hmi-card-header">
		<div class="hmi-pack-label">Solar Production</div>
		<div class="hmi-badge">NORMAL</div>
	</div>
	
	<!-- Value -->
	<div class="hmi-value-grid">
		<div class="hmi-value-box">
			<div class="hmi-box-data">
				<span class="hmi-value">--</span>
			</div>
		</div>
	</div>

	<!-- LastUpdate -->
	<div class="hmi-last-update" data-text="static">
		<span class="hmi-value-update" data-field="LastUpdate">YYYY-MM-DD hh:mm:ss</span>
	</div>
</div>
```

### Hiding Elements
To hide **do not remove the elements from the HTML definition**. 
Instead, hide them using inline styles or CSS rules. This keeps the core JavaScript event triggers from breaking.

*Example (Hiding Badge):*
```html
<div class="hmi-card-header">
	<div class="hmi-pack-label">MyTile</div>
	<div class="hmi-badge" style="display: none;"></div>
</div>
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
