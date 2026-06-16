### 4-Switch Panel Tile (Multi-Switch Blueprint)

The **4-Switch Panel Tile** is an advanced layout blueprint designed to aggregate multiple interactive switches within a single structural panel card. This avoids dashboard clutter and breaks the traditional "one device per tile" limitation of standard Domoticz widgets.

![4-Switch Panel Preview](your-screenshot-url-here.png) <!-- Optional: Add your screenshot asset link here -->

#### Key Features
* **Engine Native Integration**: Works perfectly alongside a tiny, backward-compatible adjustment to your `hmitiles.js` engine selector string.
* **ISA-101 Style Layout**: Adheres to High-Performance HMI (HPHMI) standards by keeping functional strings left-aligned, text readable, and actionable state badges explicit (`ON`/`OFF`).
* **Nesting-Safe Hierarchy**: By switching the nested elements to use the `.hmi-pack-innercard` class, the dashboard architecture clearly isolates standalone items from macro panel containers.

---

#### HTML Blueprint (Stacked Rows Layout)

To include this panel in a template layout, copy the markup block below. 
The master wrapper card functions simply as a visual boundary container, while each inner row item handles its own target Domoticz IDX sequence:

```html
<!-- 4-SWITCH COMPACT PANEL BLOCK -->
<div class="hmi-pack-card">

	<div class="hmi-card-header">
		<div class="hmi-pack-label">4-Switch Panel</div>
	</div>

	<div class="hmi-value-grid">
		<!-- SWITCH 1 (IDX 1) -->
		<div class="hmi-pack-innercard" data-type="switch" data-device-idx="1" style="margin: 0; min-height: auto;">
			<div class="hmi-card-header">
				<div class="hmi-pack-label">Switch 1</div>
				<div class="hmi-badge hmi-clickable-badge">OFF</div>
			</div>
		</div>
		<!-- SWITCH 2 (IDX 6) -->
		<div class="hmi-pack-innercard" data-type="switch" data-device-idx="6" style="margin: 0; min-height: auto;">
			<div class="hmi-card-header">
				<div class="hmi-pack-label">Switch 2</div>
				<div class="hmi-badge hmi-clickable-badge">OFF</div>
			</div>
		</div>
		<!-- SWITCH 3 (IDX 17) -->
		<div class="hmi-pack-innercard" data-type="switch" data-device-idx="17" style="margin: 0; min-height: auto;">
			<div class="hmi-card-header">
				<div class="hmi-pack-label">Switch 3</div>
				<div class="hmi-badge hmi-clickable-badge">OFF</div>
			</div>
		</div>
		<!-- SWITCH 4 (IDX 18) -->
		<div class="hmi-pack-innercard" data-type="switch" data-device-idx="18" style="margin: 0; min-height: auto;">
			<div class="hmi-card-header">
				<div class="hmi-pack-label">Switch 4</div>
				<div class="hmi-badge hmi-clickable-badge">OFF</div>
			</div>
		</div>
	</div>
</div>
```

#### Notes
This is a flexible tile which enables to define N number of switches.
Example:
```html
<!-- 2-SWITCH COMPACT PANEL BLOCK -->
<div class="hmi-pack-card">

	<div class="hmi-card-header">
		<div class="hmi-pack-label">4-Switch Panel</div>
	</div>

	<div class="hmi-value-grid">
		<!-- SWITCH 1 (IDX 1) -->
		<div class="hmi-pack-innercard" data-type="switch" data-device-idx="1" style="margin: 0; min-height: auto;">
			<div class="hmi-card-header">
				<div class="hmi-pack-label">Switch 1</div>
				<div class="hmi-badge hmi-clickable-badge">OFF</div>
			</div>
		</div>
		<!-- SWITCH 2 (IDX 6) -->
		<div class="hmi-pack-innercard" data-type="switch" data-device-idx="6" style="margin: 0; min-height: auto;">
			<div class="hmi-card-header">
				<div class="hmi-pack-label">Switch 2</div>
				<div class="hmi-badge hmi-clickable-badge">OFF</div>
			</div>
		</div>
	</div>
</div>
```
