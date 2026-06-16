# Changelog

All notable changes to **HMITiles Custom Pages Framework for Domoticz** - are documented in this file.

---

# Changelog

## 20260616 - BETA
#### Added
- **Apps**: New folder `apps` for the example applications, like SolarInfoPanel. The folder `blueprints` contains HMITile examples (must read for how-to-use).
- **4-Switches-Panel** (`blueprints`): 4 switches panel (vertical aligned).
- **Emergency Stop Button** (`blueprints`): E-Stop (Emergency Stop) using existing Push On Button architecture.
- **HMITiles Workbench** (`blueprints`): Added example number input with min 0.
- **Indicator Matrix** (`blueprints`): High-Performance Grid Indicator 3x3 Matrix.
- **Indoor Air Quality** (`blueprints`): Monitor environmental parameters. 
- **InputTile** (`blueprints`): Added example number input with min 0.
- **Log Monitor** (`blueprints`): Added a scrollable monospace terminal tile to stream server entries. Features low-contrast keyword color-matching compliant with high-performance industry standards, channel selection dropdowns (Status, Detail, Errors), and a native server-side log purge execution pipe.
- **Selector Switch** (`blueprints`): Implemented full-width dropdown control matrices that process and map configurations straight from user-defined local layout tags.
- **Wind** (`blueprints`): Indicates meteorological data values.
- **PicoServoControl** (`Apps`): Added example HMITilesLogMonitor with filter `[PicoServoControl]`.
- **Controls Routing Engine** (`core`): Extended the core listener loop to uniformly capture and execute explicit Toggle, Blinds Stop, and momentary Pulse/Push On network transmissions.
- **Controls Routing Engine** (`core`): Injected a global configuration `DEBUG` flag switch to easily gate console diagnostic outputs across browser events.
- **CSS Styles** (`core`): Horizontal rules; Additional classes related to new or updated tiles.

#### Changed
- **Blueprints**: Folder naming without prefix numbering for easier maintenance.
- **HMITiles Workbench** (`blueprints`): Reworked the index simulator template with matched virtual device IDXs and cross-referenced multi-variable datasets to support full offline rendering tests.

## 20260604
#### Added
- **Initial Public Release**: Official launch of the HMITiles Custom Pages Framework for Domoticz. Published the documentation and architecture announcement thread on the [Domoticz Community Forum](https://domoticz.com).

---

