# SWICHES

**Data Type**: `switch`, `selector`

---

## Overview
Interactive Switch & Selector Components (`data-type="switch" | "selector"`)
Switch and Selector tiles manage discrete, binary, or multi-level control arrays. Instead of displaying a passive telemetry stream, they split interaction tracks across internal horizontal or vertical grids. The background core engine scans these elements and dynamically attaches physical hardware command click handlers to any node carrying a `data-action` token.
Each switch is defined as a badge which acts as a button.

**Preview**
![Switch](switch.png)

**IMPORTANT**
Lookup `index.html` for latest examples.

-- 

## Configuration Parameters 
(HTML Data Attributes)

To build out dashboard data grid columns, configure the following core attributes on the `.hmi-pack-tile` chassis.

| Attribute | Expected Value | Description |
|-----------|----------------|-------------|
|`data-type`|"value","gauge"|Tells the JavaScript loop to register this card into the server log stream synchronization pipeline.|
|`data-device-idx`|"NNN"|Domoticz device index (`idx`) (mandatory).|
|`data-action="Toggle`|On,Off,Toggle| Binds an explicit execution payload (e.g., `On`, `Off`, or specific index commands like `10`) straight to the component node, routing click transactions directly into your backend handler loops.|
|`data-on-text`|Any text, default ON| Mandatory button text displayed when button state ON.|
|`data-off-text`||Any text, default OFF| Mandatory button text displayed when button state OFF.|

**Low-Distraction Active states**: Selected choices automatically receive the `.hmi-active-state` class from your view script. Ensure your interactive dark and light styles use desaturated background fills to preserve low operator eye strain when sitting idle.

## Template Implementations

### Standard Binary Toggle Panel (Horizontal Split)
Renders an interactive side-by-side action pair to toggle discrete system states.
```html
<div class="hmi-pack-tile">
	<div class="hmi-tile-header"><div class="hmi-pack-label">1-Button Toggle ON/OFF</div></div>
	<div class="hmi-switch-button-row">
		<div class="hmi-pack-innertile hmi-switch-col-cell" data-type="switch" data-device-idx="5" data-action="Toggle" data-on-text="ON" data-off-text="OFF">
			<div class="hmi-badge hmi-clickable-badge"></div>
		</div>
	</div>
</div>
```

### Interlocked Emergency Shutter Panel (High Priority Alert)
A single-cell safety button setup that uses your custom stylesheets to toggle active alerts or simulation flags cleanly in a single box.
```html
		<div class="hmi-pack-tile" 
			data-device-idx="9">
			<div class="hmi-tile-header"><div class="hmi-pack-label">EMERGENCY-STOP</div></div>
			<div class="hmi-switch-button-row">
				<!-- A single, full-width inner tile block.
					 The background script simply toggles the text inside the badge:
					 Normal Mode:  badge says "RESET / OK" and drops the active class
					 Tripped Mode: badge says "TRIPPED" and gains the hmi-active-state class -->
				<div class="hmi-pack-innertile hmi-switch-col-cell" 
					 data-type="switch" 
					 data-device-idx="9" 
					 data-action="Toggle" 
					 data-on-text="Tripped"
					 data-off-text="Reset"
					 id="hmi-estop-active-btn" 
					 style="width: 100%;">
					<div class="hmi-badge hmi-clickable-badge hmi-active-state"></div>
				</div>
			</div>
			<div class="hmi-last-update" data-field="LastUpdate"></div>
		</div>
```

### Multi-Button Virtual State Selection Matrix (Buttons Selector)
Lines up multiple operational states horizontally. The engine flags the selected button with the `.hmi-active-state` class automatically on update loops.
```html
<div class="hmi-pack-tile">
	<div class="hmi-tile-header"><div class="hmi-pack-label">Selector 4-Buttons</div></div>
	<div class="hmi-switch-button-row">
		
		<!-- LEVEL 0: OFF -->
		<div class="hmi-pack-innertile hmi-switch-col-cell" data-type="switch" data-device-idx="8" data-level="0" data-on-text="OFF" data-off-text="OFF">
			<div class="hmi-badge hmi-clickable-badge"></div>
		</div>

		<!-- LEVEL 10: HOME -->
		<div class="hmi-pack-innertile hmi-switch-col-cell" data-type="switch" data-device-idx="8" data-level="10" data-on-text="HOME" data-off-text="HOME">
			<div class="hmi-badge hmi-clickable-badge"></div>
		</div>

		<!-- LEVEL 20: AWAY -->
		<div class="hmi-pack-innertile hmi-switch-col-cell" data-type="switch" data-device-idx="8" data-level="20" data-on-text="AWAY" data-off-text="AWAY">
			<div class="hmi-badge hmi-clickable-badge"></div>
		</div>

		<!-- LEVEL 30: NIGHT -->
		<div class="hmi-pack-innertile hmi-switch-col-cell" data-type="switch" data-device-idx="8" data-level="30" data-on-text="NIGHT" data-off-text="NIGHT">
			<div class="hmi-badge hmi-clickable-badge"></div>
		</div>

	</div>
</div>
```

### Stacked Control Board Matrix (Vertical Grid Layout)
Arranges multi-switch parameters vertically for neat alignment inside narrow layout rows.
```html
<div class="hmi-pack-tile">
	<div class="hmi-tile-header"><div class="hmi-pack-label">2-Switch Vertical Panel</div></div>
	<div class="hmi-value-grid">

		<!-- SWITCH 1 (IDX N) -->
		<div class="hmi-pack-innertile" data-type="switch" data-device-idx="5" data-action="Toggle" data-on-text="ON" data-off-text="OFF">
			<div class="hmi-tile-header">
				<div class="hmi-pack-label">Switch 1</div>
				<div class="hmi-badge hmi-clickable-badge"></div>
			</div>
		</div>
		<!-- SWITCH 2 (IDX N) -->
		<div class="hmi-pack-innertile" data-type="switch" data-device-idx="6" data-action="Toggle" data-on-text="ON" data-off-text="OFF">
			<div class="hmi-tile-header">
				<div class="hmi-pack-label">Switch 2</div>
				<div class="hmi-badge hmi-clickable-badge"></div>
			</div>
		</div>

	</div>
</div>
```

---

