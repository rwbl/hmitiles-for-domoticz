# HMITiles LogMonitor Blueprint & Configuration Guide

The `log-monitor` tile component provides high-density, real-time tracking of the Domoticz server log database. It is optimized to stream, color-code, and filter log data efficiently inside custom dashboard interfaces.

---

## Technical Architecture (Single-Fetch Engine)
To maintain peak system performance, the framework uses a smart **Single-Fetch, Multi-Filter** data pipeline. Instead of flooding your Domoticz backend server with separate, concurrent HTTP requests for every log tile on the screen, the core engine executes **exactly one** API network request per polling refresh cycle to fetch the master server log table (`loglevel=268435455`). 

Once the data reaches the web browser, individual cards independently parse, isolate, and filter the raw log array on the client side using localized parameters and bitwise mask properties.

---

![HMITiles LogMonitor Dashboard Overview](logmonitortile.png)

---

## Component Layout Blueprint

### 1. Standard Layout Tile
A standard, compact monitor tile that fits cleanly inside your layout rows alongside other device cards.

```html
<div class="hmi-pack-card" 
     data-type="log-monitor" 
     data-device-idx="90" 
     data-log-limit="5" 
     data-log-filter="[SolarInfoDashboard]">
    
    <div class="hmi-card-header">
        <div class="hmi-pack-label">Solar Tracker Log</div>
        <!-- Local Channel Filtering Dropdown Selector -->
        <select class="hmi-log-channel-select">
            <option value="268435455">ALL LOGS</option>
            <option value="1">STATUS</option>
            <option value="2">DETAIL</option>
            <option value="4">ERRORS</option>
        </select>
    </div>
    
    <div class="hmi-value-grid">
        <div class="hmi-log-terminal"></div>
        <div class="hmi-log-input-row">
            <input type="text" class="hmi-log-input" placeholder="Type custom log message..." maxlength="100">
            <button class="hmi-log-send-btn">SEND</button>
            <button class="hmi-log-clear-btn">CLEAR</button>
        </div>
    </div>
</div>
```

### 2. Isolated Full-Page Width Tile
To display a master console span cleanly across the entire row width at the bottom of your layout without shifting or squeezing adjacent cards, append the `.hmi-log-fullpage` class definition to the element wrapper.

```html
<div class="hmi-pack-card hmi-log-fullpage" data-type="log-monitor" data-log-limit="2">
    <!-- Component internals remain identical to the standard tile layout structure -->
</div>
```

---

## Configuration Parameter Reference

* `data-type="log-monitor"`: Tells the JavaScript loop to register this card into the server log stream synchronization pipeline.
* `data-log-limit="2"`: Limits the maximum number of text entries displayed on the screen. Setting this to a tight value (like `2` or `5`) prevents vertical layout overflow.
* `data-log-filter`: *(Optional)* Case-sensitive text string pattern matching hook. If declared, the card displays only entries that contain this exact keyword.
* `data-log-prefix`: Used automatically by the custom log input stream field to prepend system tracking identifiers.

---

## Layout Customization Hints

### Hiding Input Elements
If you want a pure monitoring display without the command entry fields, **do not remove the elements from the HTML definition**. Instead, hide them using inline styles or CSS rules. This keeps the core JavaScript event triggers from breaking.

*Example (Hiding Input Row Elements):*
```html
<div class="hmi-log-input-row" style="justify-content: flex-end;">
    <input type="text" class="hmi-log-input" placeholder="Type custom log message..." maxlength="100" style="display: none;">
    <button class="hmi-log-send-btn" style="display: none;">SEND</button>
    <button class="hmi-log-clear-btn">CLEAR</button>
</div>
```

### Case-Sensitivity in Filters
The `data-log-filter` matches string sequences strictly. For example, filtering for `[picoservocontrol]` will fail to catch logs printed as `[PicoServoControl]`. Ensure your casing matches your hardware scripts exactly.

---

## Core Framework Styles (CSS Layout Rules)

Add these style properties to your primary workspace stylesheet to enable grid containment, isolated row spanning, and automatic text highlight coloring:

```css
/* =========================================================================
   LOG MONITOR CORE COMPONENTS & HIGHLIGHTS
   ========================================================================= */

/* Scrollable log output text box */
.hmi-log-terminal {
    background-color: #1a1a1a;
    border: 1px solid #333333;
    padding: 8px;
    height: 140px;
    overflow-y: auto;
    overflow-x: hidden;
    margin-bottom: 8px;
    box-sizing: border-box;
}

/* Individual terminal log line formatting */
.hmi-log-line {
    margin-bottom: 4px;
    white-space: pre-wrap;
    word-break: break-all;
    color: #d1d1d1;
    text-align: left;
    border-bottom: 1px dashed #2d2d2d;
    padding-bottom: 2px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.85rem;
    line-height: 1.3;
}

/* Localized Severity Text Highlights applied by hmitiles.js automatically */
.hmi-log-error   { color: #ff4d4d !important; font-weight: bold; } /* Red alert errors */
.hmi-log-warning { color: #ffaa00 !important; }                  /* Orange warning states */
.hmi-log-script  { color: #5cb85c !important; }                  /* Green dzVents/Lua scripts */

/* Input control row layout container */
.hmi-log-input-row {
    display: flex;
    gap: 6px;
    width: 100%;
    margin-top: 4px;
}

/* =========================================================================
   FULL-PAGE WIDTH UTILITY MODIFIER
   ========================================================================= */

/* Spans a tile edge-to-edge across a strict CSS Grid without shifting adjacent columns */
.hmi-log-fullpage.hmi-pack-card {
    grid-column: 1 / -1;          
    width: 100% !important;       
    box-sizing: border-box;
}

/* Holds full-width monitor boxes to a strict, standardized vertical envelope */
.hmi-log-fullpage .hmi-log-terminal {
    height: 140px !important;     
    max-height: 140px !important; 
    overflow-y: auto;             
    overflow-x: hidden;
}

/* Hides input row layout cleanly within the full-page width component view */
.hmi-log-fullpage .hmi-log-input-row {
    display: none !important;     
}
```
