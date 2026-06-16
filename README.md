# HMITiles Custom Pages Framework for Domoticz

**HMITiles for Domoticz** is a lightweight, decoupled HTML/CSS/JS framework designed to visualize and control your smart home devices using structured, high-density tiles.

This open-source framework brings High-Performance Human Machine Interface (HMI) principles to the smart home environment.  
The core focus is clarity, consistency, and situational awareness—not visual special effects or decorative UI clutter.

---

## Screenshots

**Solar Info Dashboard Example**  
![Solar Info Dashboard Live Data](blueprints/solarinfodashboard/solarinfodashboard-livedata.png)
![Solar Info Dashboard Trends](blueprints/solarinfodashboard/solarinfodashboard-trends.png)

**Workbench (Development / Testing Area)**  
![Workbench](blueprints/hmitilesworkbench/hmitilesworkbench.png)

**Raspberry Pi Pico WH Telemetry View**  
![Pico Telemetry View](blueprints/picotelemetryview/picotelemetryview.png)

---

## Overview

**HMITiles-for-Domoticz** provides a collection of reusable, industrial-inspired modular components for Domoticz custom layouts. These tiles combine seamlessly into responsive grid matrices to monitor complex home telemetry data points. Designed as an extensible blueprint, it decouples user interface presentation from backend data fetching, allowing developers to create clean, high-performance layouts easily.

The framework started as a personal open-source project, evolving from earlier layout prototypes developed under a [B4X HMITiles](http://www.b4x.com/android/forum/threads/hmitiles.169774/) design concept.

---

## Core Features & Design Principles

* **High-Performance HMI Rules**: Follows industrial HMI principles. Elements maintain muted gray or dark charcoal baselines during steady-state runtime. Saturated, desaturated warning highlights are reserved strictly for active alarm thresholds (`data-warn-low`, `data-crit-high`) to reduce operator eye strain and draw attention efficiently.
* **Decoupled Architecture**: Keeps visual presentation layout properties completely isolated from backend server data fetches. 
* **Declarative DOM Injection**: Zero-config device mapping. Domoticz hardware registers bind instantly to the user interface using clean HTML `data-device-idx` attributes.
* **Ecosystem Extension Hooks**: Leverages a central `window.onHMITileProcess` callback executing at the top of the processing loop. Custom layouts can intercept, evaluate, and transform incoming data packets (e.g., streaming 24-hour canvas sparkline trend lines, managing text inputs, or running complex multi-variable conditions) without triggering separate polling loops or stalling the server.
* **Generic State Validation**: Automated alarm handlers (`checkAlarmThresholds`) evaluate numeric profiles natively using metadata tags embedded in your HTML layout, removing all hardcoded device indexing from the core code.
* **Independent Page Routing**: Engineered to function as completely standalone, purpose-driven custom pages built for discrete automation monitoring tasks.

**Design Philosophy**
This framework bypasses typical flashy smart-home trends to strictly mirror modern industrial SCADA standards - using muted baselines to reduce eye strain and reserving high-contrast colors exclusively for active process alarms.

---

## Included Page Blueprints
(Selective)

* **`hmitilesworkbench`**: An interactive testing layout panel used for mocking up new modular components, validating styles, and debugging device index assignments.
* **`valuetile`**: A basic entry-level walkthrough for establishing file pathways, creating your first tile wrapper, and establishing server handshakes.
* **`solarinfodashboard`**: A dense four-column process view detailing live energy flows across production, household consumption, grid balance, and battery bank state-of-charge.
* **`picoservocontrol`**: A clean, WiFi-based microcontroller interface facilitating remote multi-axis servo positioning commands.
* **`picotelemetryview`**: Real-time diagnostic monitoring tracking internal silicon temperature logs, virtual text data timestamps, and antenna Wi-Fi RSSI signal strength fields.

---

## Directory Manual Mapping

The `blueprints/` folder acts as an interactive repository index. 

Selecting any blueprint directory on GitHub will automatically render its localized `README.md` containing specific implementation code blocks, connection tutorials, and layout previews:

---

## Repository Structure

```
HMITiles-for-Domoticz/
├── core/                           	# Standard shared framework engines
│   ├── hmitiles.css                	# Global styling for all tiles and layouts
│   └── hmitiles.js                 	# Shared UI logic (bulk polling loop, hook dispatcher)
├── apps/                     			# Custom page example applications
│   ├── solarinfopanel/      			# Solar Info Panel with live data & trends
│   └── ...								# More examples
├── blueprints/                     	# Custom page examples, tutorials, and apps
│   ├── hmitilesworkbench/      		# Tile design test bed folder
│   │   ├── index.html              	# Standalone workbench interface markup
│   │   ├── HMITilesWorkbench.html  	# Domoticz custom page wrapper definition
│   │   ├── README.md               	# Detailed usage instructions
│   │   └── hmitilesworkbench.png  	    # Layout preview graphic
│   ├── valuetile/ 	                    # Example using value tile
│   │   ├── ValueTile.html     	        # Domoticz custom page tab navigation file
│   │   ├── valuetile/         	        # Core application directory
│   │   └── index.html              	# Main blueprint page structure
│   └── ...								# More blueprints
├── LICENSE                         	# MIT open-source license
└── README.md                       	# Documentation entry point manual
```

---

## Quick Start

Follow these steps to deploy and run the `SingleTilePage` blueprint example directly inside your local Domoticz installation.

1. **Deploy Core Framework**: Copy the files `hmitiles.css` and `hmitiles.js` from the `core/` repository folder into your Domoticz `/www/templates/` directory.
2. **Select the Blueprint**: Navigate into the repository folder `blueprints/valuetile/`.
3. **Deploy Custom Page Wrapper**: Copy the file `ValueTile.html` into your Domoticz `/www/templates/` directory.
4. **Deploy Application Subfolder**: Copy the entire subfolder `valuetile/` into your Domoticz `/www/templates/` directory.
5. **Launch Interface**: Open your Domoticz Web UI -> select the **Custom** tab -> click **ValueTile**. The custom dashboard view `ValueTile` will load immediately.

### Final Domoticz Directory Structure
Your Domoticz `/www/templates/` server folder path must reflect this exact layout:
```
domoticz/www/templates/
├── hmitiles.css            # Framework shared styles
├── hmitiles.js             # Core polling and hook loop engine
├── ValueTile.html     		# Domoticz tab navigation wrapper file
└── valuetile/         		# Dedicated application folder assets
	└── index.html          # Main HTML structure and page hook scripts
```
---

## Project Status

This is an experimental hobby framework shared as-is for smart home automation developers and will continue to evolve over time. 
**It is not a commercial, ready-made consumer product.**

---

## Credits & Acknowledgments

This framework was made possible thanks to the foundational work of the open-source home automation community and collaborative engineering support:

* **[Domoticz Home Automation](https://domoticz.com)** – For providing the open-source smart home server environment.
* **AI Collaboration Support** – For real-time architectural engineering, code optimization, and assistance refactoring the ecosystem.

---

## License

Developed by **Robert W.B. Linn** — Released under the terms of the [MIT License]
