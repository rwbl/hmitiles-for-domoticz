# Domoticz-HMITiles

An open-source HMI (Human Machine Interface) tile layout framework for Domoticz (http://domoticz.com), inspired by industrial HMI/SCADA design principles.

This project provides a lightweight web-based dashboard system combining:
- dzVents automation scripts
- optional Node-RED / Python data sources
- HTML5/CSS3/JavaScript custom dashboard pages

It is a practical home automation visualization layer rather than a production-grade SCADA system.

---

## Project Status

This project is under active development and will continue to evolve.

The current implementation reflects working prototypes and personal use cases. Some components are experimental and may change or be refactored over time.

This is not a finished or fully hardened product.

---

## Features

- Tile-based dashboard layout for Domoticz devices
- Responsive grid-based UI structure (e.g. 4×3 layouts)
- Modular separation of UI, logic, and data sources
- Clickable tiles linking to Domoticz device detail/log views
- Manual refresh support for live data updates
- Basic alarm coloring based on threshold values (warning / critical states)
- Support for multiple dashboards and independent modules

---

## HMITiles Ecosystem

The repository includes example dashboards demonstrating different use cases:

- SolarInfoDashboard – Solar production, battery status, and grid power visualization
- ServoControl – Simple actuator control using sliders and switches
- PicoTelemetry – Microcontroller telemetry (temperature, RSSI, system status)
- HMITilesOverview – Multi-node overview dashboard

These examples are intended as reference implementations and starting points.

---

## HMITiles Workbench

The `workbench/` directory is an isolated development and testing environment.

It is used for:
- Experimenting with new tile types
- Testing layout behavior
- Developing UI components before integrating them into dashboards

### Workbench Preview

![HMITiles Workbench](images/domoticz-hmitiles-workbench-1.png)

---

## QUICK_START

The `QUICK_START.md` guide explains how to build a basic dashboard layout from scratch using the Domoticz-HMITiles framework.

It focuses on:
- Folder structure
- Basic tile integration
- Connecting Domoticz device data
- Minimal working dashboard setup

---

## Repository Structure

```text
Domoticz-HMITiles/
├── LICENSE
├── QUICK_START.md
└── www/
    └── templates/
        ├── hmitiles.css
        ├── hmitiles.js
        ├── SolarInfoDashboard.html
        ├── ServoControl.html
        ├── PicoTelemetry.html
        ├── HMITilesOverview.html
        ├── solarinfodashboard/
        │   ├── index.html
        │   └── trends.html
        ├── servocontrol/
        │   └── index.html
        └── PicoTelemetry/
            └── index.html
```
---

## Architecture Guidelines

When extending or building new dashboards:

1. Keep shared assets generic  
   `hmitiles.js` and `hmitiles.css` must not contain page-specific logic or device IDs.

2. Scope all page logic locally  
   Use `DOMContentLoaded` and block-scoped variables (`const`, `let`) for all dashboard-specific code.

3. Avoid selector collisions  
   Prefer structured attributes like `data-device-idx` combined with type-specific attributes.

4. Keep UI visually minimal  
   Use neutral tones for baseline UI and reserve strong colors for active warnings or alarms.

---

## Documentation

Additional documentation is available per module:

- QUICK_START.md – basic setup and first dashboard
- SolarInfoDashboard – solar and energy monitoring setup
- ServoControl – actuator and slider control logic
- PicoTelemetry – microcontroller telemetry integration

(These module READMEs are located inside their respective folders.)

---

## License

MIT License

---

## Notes

This project is experimental and intended for personal/home automation use. Interfaces and internal structure may change without notice.

