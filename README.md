# Domoticz-HMITiles

Tile-based custom pages for Domoticz using HTML/CSS/JS.

An open-source project for experimenting with structured, tile-based dashboards inside Domoticz custom pages. 
It is shared mainly as inspiration for others building their own UI solutions.

---

## Screenshots

**SolarInfo Dashboard example**  
![Solar dashboard](blueprints/50-solar-info-dashboard/solarinfodashboard-livedata.png)
![Solar dashboard](blueprints/50-solar-info-dashboard/solarinfodashboard-trend.png)

**Workbench (development / testing area)**  
![Workbench](blueprints/10-hmitiles-workbench/hmitiles-workbench.png)

**Raspberry Pi Pico WH Telemetry**  
![Workbench](blueprints/52-pico-telemetry-view/pico-telemetry-view.png)

---

## Overview

Domoticz-HMITiles is a set of reusable HMI-style tiles for Domoticz custom pages.

These tiles can be combined to build structured, tile-based dashboards for visualizing device data.

The project started as a personal experiment based on earlier work with a [B4X HMITiles](http://www.b4x.com/android/forum/threads/hmitiles.169774/) concept.

---

## Key ideas

- Tile-based layout for device visualization
- Simple HMI (Human Machine Interface) style design approach
- Separation between UI logic and Domoticz data handling
- Binding elements via `data-device-idx`
- Minimal visual design with optional alarm highlighting
- Independent custom pages per use case

---


## Key Features & Design Principles

* **High-Performance HMI Rules**: Following widely accepted industrial HMI principles. Elements maintain muted gray or dark charcoal baselines during normal runtime, allowing desaturated alert indicators to draw operator attention cleanly without eye strain.
* **Decoupled Architecture**: Keeps visual presentation logic completely isolated from raw Domoticz polling cycles.
* **Declarative DOM Injection**: Zero-config device mapping. Hardware metrics link natively to HTML tags using standard `data-device-idx` attributes.
* **Ecosystem Extension Hooks**: Allows individual custom pages to safely intercept the main core dataset flow. This lets you build advanced multi-threshold alarms, virtual text timestamps, and historical trend charts without creating duplicate interval loops or over-polling your Domoticz backend.
* **Independent Routing**: Designed to run as completely standalone custom pages engineered specifically for targeted automation use cases.

---

## Included Page Blueprints

* **`10-hmitiles-workbench`**: An interactive playground used for prototyping layouts, creating new visual tile components, and testing experimental structures.
* **`50-solar-info-dashboard`**: A comprehensive system layout tracking live flows across solar production, house consumption, grid balance, and battery bank state-of-charge.
* **`51-pico-servo-control`**: A WiFi-based micro-controller dashboard enabling remote multi-axis servo position adjustments.
* **`52-pico-telemetry-view`**: Real-time diagnostic monitoring for remote nodes, featuring processor core temperatures, virtual data update timestamps, and antenna Wi-Fi RSSI attenuation tracks.

---

## Directory Manual Mapping

The `blueprints/` directory houses independent, self-contained documentation packages. 
Opening any blueprint folder on GitHub will automatically render its local `README.md` containing full setup guides, code files, and visual element previews:

* **[10] Framework Tile Workbench** -> `blueprints/10-hmitiles-workbench/`
* **[20-49] Step-By-Step Tutorials** -> Guide blueprints for building your first custom tile and standalone pages.
* **[50+] Ready-to-Run Applications** -> Full deployment examples featuring the centralized ecosystem hook architecture.

---

## Repository structure

```
domoticz-hmitiles/
├── core/                         	# Standard shared framework engines
│   ├── hmitiles.css				# Global styling for all tiles and layouts
│   └── hmitiles.js					# Shared UI logic (device binding, DOM helpers)
├── blueprints/                   	# Custom page examples, tutorials
│   ├── 10-hmitiles-workbench/		# Folder blueprint
│   │   ├── hmitilesworkbench		# Folder main layout
│   │   ├──── index.html            # Main UI layout
│   │   ├── HMITilesWorkbench.html	# Domoticz custom page wrapper
│   │   ├── README.md             	# Documenattion
│   │   └── hmitiles-workbench.png	# Screenshot of Custom Page
│   │
│   ├── 20-create-single-tile-page
│   │   ├── SingleTilePage.html
│   │   ├── singletilepage			# Folder main layout
│   │   └──── index.html            # Main UI layout
│   │
│   ├── more blueprints
│   ├── ...
│   └── ...
├── LICENSE						  # MIT license
└── README.md                     # Documentation entry point
```

---

## Quick Start

Follow these steps to deploy and run the `SingleTilePage` blueprint example directly inside your local Domoticz installation.

1. **Deploy Core Framework**: Copy the files `hmitiles.css` and `hmitiles.js` from the `core/` repository folder into your Domoticz `/www/templates/` directory.
2. **Select the Blueprint**: Navigate into the repository folder `blueprints/20-create-single-tile-page/`.
3. **Deploy Custom Page Wrapper**: Copy the file `SingleTilePage.html` into your Domoticz `/www/templates/` directory.
4. **Deploy Application Subfolder**: Copy the entire subfolder `singletilepage/` into your Domoticz `/www/templates/` directory.
5. **Launch Interface**: Open your Domoticz Web UI -> select the **Custom** tab -> click **SingleTilePage**. The custom dashboard view `Blueprint Single Tile Page` will load immediately.

### Final Domoticz Directory Structure
Your Domoticz `/www/templates/` server folder path must reflect this exact layout:
```
hmitiles.css
hmitiles.js
singletilepage
	index.html
SingleTilePage.html	
```

--

## Notes

This is an experimental hobby project and may evolve over time. **It is not a finished product.**

Feedback, ideas, and suggestions are welcome.

---

## License

MIT License