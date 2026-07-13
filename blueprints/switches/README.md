# Swiches

## Interactive Switch & Selector Components (`data-type="switch" | "selector"`)
Switch and Selector tiles manage discrete, binary, or multi-level control arrays. Instead of displaying a passive telemetry stream, they split interaction tracks across internal horizontal or vertical grids. The background core engine scans these elements and dynamically attaches physical hardware command click handlers to any node carrying a `data-action` token.

**Preview**
![Switch](switch.png)

### Core Switch Configuration Markups##### 1. Standard Binary Toggle Panel (Horizontal Split)*Renders an interactive side-by-side action pair to toggle discrete system states.*```html
```
<div class="hmi-pack-tile" data-device-idx="1" data-type="switch">
    <div class="hmi-tile-header"><div class="hmi-pack-label">Switch (ON/OFF)</div></div>
    <div class="hmi-switch-button-row">
        <div class="hmi-pack-innertile hmi-switch-col-cell" data-action="Off">
            <div class="hmi-badge">OFF</div>
        </div>
        <div class="hmi-pack-innertile hmi-switch-col-cell" data-action="On">
            <div class="hmi-badge">ON</div>
        </div>
    </div>
</div>
```

### 2. Interlocked Emergency Shutter Panel (High Priority Alert)*A single-cell safety button setup that uses your custom stylesheets to toggle active alerts or simulation flags cleanly in a single box.*```html
```
<div class="hmi-pack-tile" data-device-idx="9" data-type="switch">
    <div class="hmi-tile-header"><div class="hmi-pack-label">EMERGENCY-STOP</div></div>
    <div class="hmi-switch-button-row">
        <div class="hmi-pack-innertile hmi-switch-col-cell" data-action="Toggle" id="hmi-estop-active-btn" style="width: 100%;">
            <div class="hmi-badge hmi-clickable-badge hmi-active-state">TRIPPED</div>
        </div>
    </div>
    <div class="hmi-last-update" data-field="LastUpdate">YYYY-MM-DD hh:mm:ss</div>
</div>
```
### 3. Multi-Button Virtual State Selection Matrix (Buttons Selector)*Lines up multiple operational states horizontally. The engine flags the selected button with the `.hmi-active-state` class automatically on update loops.*```html
```
<div class="hmi-pack-tile" data-device-idx="15" data-type="selector">
    <div class="hmi-tile-header"><div class="hmi-pack-label">Selector (Buttons)</div></div>
    <div class="hmi-switch-button-row">
        <div class="hmi-pack-innertile hmi-switch-col-cell" data-action="0"><div class="hmi-badge">OFF</div></div>
        <div class="hmi-pack-innertile hmi-switch-col-cell" data-action="10"><div class="hmi-badge">HOME</div></div>
        <div class="hmi-pack-innertile hmi-switch-col-cell" data-action="20"><div class="hmi-badge">AWAY</div></div>
        <div class="hmi-pack-innertile hmi-switch-col-cell" data-action="30"><div class="hmi-badge">NIGHT</div></div>
    </div>
</div>
```
### 4. Stacked Control Board Matrix (Vertical Grid Layout)*Arranges multi-switch parameters vertically for neat alignment inside narrow layout rows.*```html
```
<div class="hmi-pack-tile" data-device-idx="22" data-type="switch">
    <div class="hmi-tile-header"><div class="hmi-pack-label">2-Switch Vertical Panel</div></div>
    <div class="hmi-switch-button-stack">
        <div class="hmi-switch-row-cell">
            <span class="hmi-switch-label">Switch 1</span>
            <div class="hmi-pack-innertile hmi-badge" data-action="Toggle">OFF</div>
        </div>
        <div class="hmi-switch-row-cell">
            <span class="hmi-switch-label">Switch 2</span>
            <div class="hmi-pack-innertile hmi-badge" data-action="Toggle">OFF</div>
        </div>
    </div>
</div>
```
### 5. High-Density Array Grid (8-Switch Matrix Combo Block)*Combines horizontal action rows to track multiple relay states, zone boundaries, or circuit loads simultaneously.*```html
```
<div class="hmi-pack-tile" data-device-idx="40" data-type="switch">
    <div class="hmi-tile-header"><div class="hmi-pack-label">8-Switch Horizontal Panel</div></div>
    
    <!-- Row 1: Primary Phase Outputs -->
    <div class="hmi-switch-button-row" style="margin-bottom: 6px;">
        <div class="hmi-pack-innertile hmi-switch-col-cell" data-action="P1_Toggle"><div class="hmi-badge">P1</div></div>
        <div class="hmi-pack-innertile hmi-switch-col-cell" data-action="P2_Toggle"><div class="hmi-badge">P2</div></div>
        <div class="hmi-pack-innertile hmi-switch-col-cell" data-action="P3_Toggle"><div class="hmi-badge">P3</div></div>
        <div class="hmi-pack-innertile hmi-switch-col-cell" data-action="P4_Toggle"><div class="hmi-badge">P4</div></div>
    </div>
    
    <!-- Row 2: Secondary Feedback Lines -->
    <div class="hmi-switch-button-row">
        <div class="hmi-pack-innertile hmi-switch-col-cell" data-action="F1_Toggle"><div class="hmi-badge">F1</div></div>
        <div class="hmi-pack-innertile hmi-switch-col-cell" data-action="F2_Toggle"><div class="hmi-badge">F2</div></div>
        <div class="hmi-pack-innertile hmi-switch-col-cell" data-action="F3_Toggle"><div class="hmi-badge">F3</div></div>
        <div class="hmi-pack-innertile hmi-switch-col-cell" data-action="F4_Toggle"><div class="hmi-badge">F4</div></div>
    </div>
</div>
```

---

### Interactive Execution Laws
* **`data-action="[Command]"`**: Binds an explicit execution payload (e.g., `On`, `Off`, or specific index commands like `10`) straight to the component node, routing click transactions directly into your backend handler loops.
* **Low-Distraction Active states**: Selected choices automatically receive the `.hmi-active-state` class from your view script. Ensure your interactive dark and light styles use desaturated background fills to preserve low operator eye strain when sitting idle.

