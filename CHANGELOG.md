# Changelog

All notable changes to **HMITiles Custom Pages Framework for Domoticz** - are documented in this file.

---

## v2.0.0 - (2026-07-13)
**Major framework core engineering rewrite.**

### Summary
Engine completely re-engineered from the ground up to achieve a purely declarative, decoupled, low-cognitive-load architecture. 
This release eliminates inline script blocks from layout files, centralizes event lifecycle boundaries, updates structural typography for high-density industrial environments, 
introduces a unified multi-column data model, and launches an experimental standalone dark theme workspace profile.

### Architectural Breakdown

#### 1. Core JavaScript Engine Overhaul
* **Declarative Routing**: Completely migrated tile rendering logic to an HTML-driven `data-type` property loop. The core engine loop now automatically initializes layout templates, eliminating the previous tight coupling between raw Domoticz properties and UI element nodes.
* **Global Event Delegation**: Isolated interactive event boundaries into an independent control-binding pipeline (`bindControls`). All control gestures (`click`, `change`, `keypress`, `input`) are attached exactly once onto the permanent document root context, ensuring interaction tracks are completely immune to network synchronization redraws.
* **Unified Pre-Parser Layer**: Integrated a centralized hardware utility dictionary inside `hmitiles-preparser.js` to process single-value devices via local `parseSingleValue()` hooks, evaluate array-shifted metrics matrices generically, and automatically handle inconsistent Domoticz casing rules or query variables safely behind the scenes.
* **Natively Integrated Sparklines**: Shifted the historical 24-hour rolling trend engine directly into the core code. Charts are initialized cleanly via `data-type="trend"`, automatically processing data ranges natively to draw responsive SVG line paths with zero visual layout overhead.
* **Expanded Core Component Catalog**: Native support fully established for `info`, `value`, `input`, `switch`, `selector`, `dimmer`, `slider`, `gauge`, `trend`, `progressbar`, `setpoint`, `setpointprocessvalue`, and `chart` card modules.
* **Dynamic Float Precision Guard**: Enhanced the data preparation pipeline with a string-locked floating-point extraction utility (`formatPrecisionValue`) ensuring ultra-high resolution metrics (such as precision `0.0000 kWh` solar accumulation counters) retain trailing decimals without collapsing.

#### 2. Core Stylesheet & Typography Refinements
* **Refactored Box Layouts**: Migrated all old structural container components to the standardized `.hmi-pack-tile` element schema. 
* **Industrial Color Calibration**: Updated background gradients, button fills, and borders to ensure total compliance with high-performance cockpit industry standards (ISA-101).
* **Local Offline Fonts**: Integrated a crisp, high-contrast typography layer using locally hosted assets. The entire UI is now 100% self-contained and immune to internet outages.

#### 3. Simplified Threshold & Alarm Engine
* **Declarative Threat Matrix**: Wiped out complex conditional checking scripts by introducing a lightweight, single-attribute HTML configuration mapping: `data-state-map` paired with an explicit `data-alarm-direction`. 
* **Universal Severity Evaluator**: Multi-tier alarm state escalations (upward spikes or downward battery drains) are handled uniformly inside a single engine tracking pass that maps directly onto Domoticz's native 5-level alarm scale (`gray`, `green`, `yellow`, `orange`, `red`).
* **Adaptive Array Length Scaling**: Built a dynamic router into `processTileStateAndAlarm()` that evaluates the explicit length of the threshold rule string array. Shorter 2-state inputs (e.g., Water Leaks) switch dynamically between Level 0 and Level 4 to enforce high-contrast emergency awareness instantly.
* **Defensive Edge-Clamping Logic**: Fixed range-boundary logic loops by initializing state values with an explicit boundary fallback ceiling. This halts code lockouts and prevents `CONDITION: 0` glitches when sensor data surpasses maximum threshold parameters.

#### 4. Unified Multi-Column & Single-Value Concept
* **Unified Sizing Framework**: Merged standalone value tiles into a multi-column layout tracking grid matrix, allowing a single card shell to display up to 7 telemetry data columns dynamically using explicit `data-labels` maps.
* **Dynamic Grid Balance**: Introduced automatic spatial cushioning (`flex-basis: 100% !important`) on individual `.hmi-multivalue-col` nodes. This forces symmetrical widths across data cells, preventing empty unit values from causing visual column collisions or clipping.
* **Single-Value Normalization Pipeline**: Enhanced the `data-labels` attribute loop to process standard single-value devices natively. Defining only a single column layout map converts the payload into a clean, uniform multi-column grid matrix model (`${value};${state}`), treating single data points identically to heavy arrays.
* **Legacy Bypass Fail-Safe**: Integrated a fallback rule where any card omitting advanced attributes completely avoids data modification. Raw Domoticz device logs pass straight to the view layer untouched, preserving 100% backward compatibility for legacy text tiles.

#### 5. Experimental Dark Theme Architecture
* **Decoupled Styling Channel**: Launched a standalone `hmitiles-dark.css` sheet allowing clear dark-slate (`#1a1d24` / `#23262e`) canvas maps to mount cleanly onto elements without bloating light-mode source structures.
* **Interactive Hover Protection**: Integrated an explicit `pointer-events: none !important;` layout shield for specialized components. This freezes SVG arcs, vector needle pathways, and background fills during mouse movements, completely stopping light-mode text-color leaks.

---

## 20260619 (1.5.0)
#### Added
- **SwitchesPanel** (`blueprints`): Define a panel with N switches (vertical aligned).
- **Alarm** (`blueprints`): Alarm concept with 5 Tier Slots: `critical`, `high`, `medium`, `low`, `info`, and `normal` (for the baseline fallback text).
- **Emergency Stop Button** (`blueprints`): E-Stop (Emergency Stop) using existing Push On Button architecture.
- **HMITiles Workbench** (`blueprints`): Added example number input with min 0.
- **Indicator Matrix** (`blueprints`): High-Performance Grid Indicator 3x3 Matrix.
- **Indoor Air Quality** (`blueprints`): Monitor environmental parameters. 
- **InputTile** (`blueprints`): Added example number input with min 0.
- **Log Monitor** (`blueprints`): Added a scrollable monospace terminal tile to stream server entries. Features low-contrast keyword color-matching compliant with high-performance industry standards, channel selection dropdowns (Status, Detail, Errors), and a native server-side log purge execution pipe.
- **Selector Switch** (`blueprints`): Implemented full-width dropdown control matrices that process and map configurations straight from user-defined local layout tags.
- **Wind** (`blueprints`): Indicates meteorological data values.
- **PicoServoControl** (`examples`): Added LogMonitor tile with filter `[PicoServoControl]` to log commands.
- **Controls Routing Engine** (`core`): Extended the core listener loop to uniformly capture and execute explicit Toggle, Blinds Stop, and momentary Pulse/Push On network transmissions.
- **Controls Routing Engine** (`core`): Injected a global configuration `DEBUG` flag switch to easily gate console diagnostic outputs across browser events.
- **CSS Styles** (`core`): Horizontal rules; Additional classes related to new or updated tiles.
- **Folder examples**: New folder `examples` with SolarInfoPanel, PicoServoControl, PicoTelemetryView. The folder `blueprints` contains HMITile examples (must read for how-to-use).
- **Folder tools**: New folder `hmitilesindex` with high-density dashboard solution designed specifically for **Domoticz** and optimized for **HMITiles**. 

#### Changed
- **Folder blueprints**: Blueprint sub-folders naming without prefix numbering for easier maintenance.
- **HMITiles Workbench** (`blueprints`): Reworked the index simulator template with matched virtual device IDXs and cross-referenced multi-variable datasets to support full offline rendering tests.

---

## 20260604 (1.0.0)
#### Added
- **Initial Public Release**: Official launch of the HMITiles Custom Pages Framework for Domoticz. Published the documentation and architecture announcement thread on the [Domoticz Community Forum](https://domoticz.com).

---

