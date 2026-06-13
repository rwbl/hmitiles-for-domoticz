# Changelog

All notable changes to **HMITiles Custom Pages Framework for Domoticz** - are documented in this file.

---

# Changelog

## 20260613 - BETA
#### Added
- **Emergency Stop Button** (`HMITile`): E-Stop (Emergency Stop) using existing Push On Button architecture.
- **HMITile Indicator Matrix** (`HMITile`): High-Performance Grid Indicator 3x3 Matrix.
- **HMITile Log Monitor** (`HMITile`): Added a scrollable monospace terminal tile to stream server entries. Features low-contrast keyword color-matching compliant with high-performance industry standards, channel selection dropdowns (Status, Detail, Errors), and a native server-side log purge execution pipe.
- **HMITile Selector Switch** (`HMITile`): Implemented full-width dropdown control matrices that process and map configurations straight from user-defined local layout tags.
- **Controls Routing Engine** (`hmitiles.js`): Extended the core listener loop to uniformly capture and execute explicit Toggle, Blinds Stop, and momentary Pulse/Push On network transmissions.
- **Styles** (`hmitiles.css`): Horizontal rules; Additional classes related to new tiles.
- **PicoServoControl** (`Example`): Added HMITilesLogMonitor with filter `[PicoServoControl]`.

#### Changed
- **HMITiles Workbench** (`Example`): Reworked the index simulator template with matched virtual device IDXs and cross-referenced multi-variable datasets to support full offline rendering tests.
- **Core Script Layout** (`hmitiles.js`): Injected a global configuration `DEBUG` flag switch to easily gate console diagnostic outputs across browser events.

## 20260604
#### Added
- **Initial Public Release**: Official launch of the HMITiles Custom Pages Framework for Domoticz. Published the documentation and architecture announcement thread on the [Domoticz Community Forum](https://domoticz.com).

---

