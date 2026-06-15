### 📦 4-Switch Panel Tile (Multi-Switch Blueprint)

The **4-Switch Panel Tile** is an advanced layout blueprint designed to aggregate multiple interactive switches within a single structural panel card. This avoids dashboard clutter and breaks the traditional "one device per tile" limitation of standard Domoticz widgets.

![4-Switch Panel Preview](your-screenshot-url-here.png) <!-- Optional: Add your screenshot asset link here -->

#### ✨ Key Features
* **Zero Engine Changes**: Runs completely out-of-the-box using your existing `hmitiles.js` engine and `hmitiles.css` stylesheets. It works entirely by using native DOM query selectors.
* **ISA-101 Style Layout**: Adheres to High-Performance HMI (HPHMI) standards by keeping functional strings left-aligned, text readable, and actionable state badges explicit (`ON`/`OFF`).
* **Highly Adaptable**: Serves as an easy structural blueprint for other multi-switch combinations (e.g., 2x2 grids, or a single row of 3 horizontal switches).

---

#### 🛠️ HTML Blueprint (Stacked Rows Layout)

To include this panel in your `index.html`, copy the markup block below. The outer wrapping container has its individual `data-type` and `data-device-idx` tags removed to prevent engine selector conflicts, allowing each inner row item to bind cleanly to its independent Domoticz IDX sequence:

```html
<!-- 4-SWITCH COMPACT PANEL BLOCK -->
<div class="hmi-pack-card">
    <!-- Panel Identification Header -->
    <div class="hmi-card-header">
        <div class="hmi-pack-label">4-Switch Panel</div>
    </div>

    <!-- Multi-Item Layout Flex Container -->
    <div style="display: flex; flex-direction: column; gap: 8px; width: 100%; padding: 10px; box-sizing: border-box;">

        <!-- SWITCH 1 (IDX 1) -->
        <div class="hmi-pack-card" data-type="switch" data-device-idx="1" style="margin: 0; min-height: auto; width: 100%;">
            <div class="hmi-card-header" style="border-bottom: none;">
                <div class="hmi-pack-label">Living Room Light</div>
                <div class="hmi-badge hmi-clickable-badge">OFF</div>
            </div>
        </div>

        <!-- SWITCH 2 (IDX 6) -->
        <div class="hmi-pack-card" data-type="switch" data-device-idx="6" style="margin: 0; min-height: auto; width: 100%;">
            <div class="hmi-card-header" style="border-bottom: none;">
                <div class="hmi-pack-label">Kitchen Ventilation</div>
                <div class="hmi-badge hmi-clickable-badge">OFF</div>
            </div>
        </div>

        <!-- SWITCH 3 (IDX 17) -->
        <div class="hmi-pack-card" data-type="switch" data-device-idx="17" style="margin: 0; min-height: auto; width: 100%;">
            <div class="hmi-card-header" style="border-bottom: none;">
                <div class="hmi-pack-label">Dining Room Pendant</div>
                <div class="hmi-badge hmi-clickable-badge">OFF</div>
            </div>
        </div>

        <!-- SWITCH 4 (IDX 18) -->
        <div class="hmi-pack-card" data-type="switch" data-device-idx="18" style="margin: 0; min-height: auto; width: 100%;">
            <div class="hmi-card-header" style="border-bottom: none;">
                <div class="hmi-pack-label">Hallway Nightlight</div>
                <div class="hmi-badge hmi-clickable-badge">OFF</div>
            </div>
        </div>

    </div>
</div>
```

---

#### 📐 Modification Blueprint Examples

##### Alternative: 3 Horizontal Switches in a Row
If you prefer a horizontal row layout for wider panels or top navigation toolbars, change the inner layout container style from a vertical flex column to a horizontal layout matrix:

```html
<!-- Replace the internal layout container with this block to split 3 items horizontally -->
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 100%; padding: 10px; box-sizing: border-box;">
    <!-- Add 3 standard switch card structures inside here -->
</div>
```
