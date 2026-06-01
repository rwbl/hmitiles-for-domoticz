# Domoticz-HMITiles

An open-source HMI (Human Machine Interface) tile layout framework for [Domoticz](http://domoticz.com), following widely accepted industrial HMI principles.

This repository provides a lightweight, modular web-ecosystem port of the original **B4X HMITiles Library**, unifying optimized **dzVents automation scripts**, **asynchronous shell pipelines**, and **decoupled HTML5/CSS3/JS custom pages**.

---

## 📢 Project Status & Context

* **Under Active Construction:** This project is under continuous development and will be expanded further. The tiles and custom dashboard solutions created so far represent specific use cases actively deployed by the author.
* **Personal & Private Use Only:** This framework and its sub-modules are tailored for private application and individual home lab testing.
* **Born From Curiosity:** This entire project was created purely out of curiosity to explore if it was technically viable to design robust, high-performance industrial HMI/SCADA-type Custom Pages within the native Domoticz environment.

---

## ✨ Key Features & Capabilities

The following core features apply across the provided dashboard examples:

* **Industry-Inspired Design:** Structured, clean tiles focus heavily on situational awareness and clear data hierarchy.
* **Perfect 4x3 Grid Matrix:** Instant layout mapping across critical system infrastructure points.
* **Interactive Logger Integration:** Clicking an active tile element instantly targets and opens the native Domoticz device chart log view.
* **Asynchronous Manual Updates:** Trigger real-time, ad-hoc server data polls safely with a looping-protected manual refresh layout.
* **Dynamic Industrial Alarms:** Live data-alarm attribute injection handles dynamic boundary colors (Warning/Critical) natively based on parsed metric thresholds.

---

## 🚀 The HMITiles Ecosystem & Solutions

The framework uses clean, low-fatigue layout matrices designed to visualize smart home infrastructure with high data density. 
It features several complete, out-of-the-box custom sub-dashboards examples:

* **SolarInfoDashboard:** Active solar generation, battery charging cycles, and power grid net-metering metrics.
* **ServoControl:** Interactive automation panel linking switches and percentage positioning sliders directly to hardware endpoints.
* **PicoDiag:** Multi-variable controller telemetry tracking microcontroller chip temperatures alongside real-time Wi-Fi signal attenuation profiles (RSSI).
* **HMITilesOverview:** A high-level overview management layer displaying multiple hardware nodes simultaneously.

---

## 📁 Repository Directory Structure

```text
Domoticz-HMITiles/
├── LICENSE                     # MIT License
├── QUICK_START.md              # 2-minute local deployment guide
└── www/
    └── templates/
        ├── hmitiles.css        # Global CSS shared style definitions
        ├── hmitiles.js         # Global JS shared engine (handles DOMOTICZ_URL)
        ├── SolarInfoDashboard.html   # Domoticz custom tab menu wrapper
        ├── ServoControl.html         # Domoticz custom tab menu wrapper
        ├── PicoDiag.html             # Domoticz custom tab menu wrapper
        ├── HMITilesOverview.html     # Domoticz custom tab menu wrapper
        ├── solarinfodashboard/       # Dedicated asset directory for Solar
        │   ├── index.html            # Main solar interface layout
        │   └── trends.html           # Historical SVG sparkline chart panel
        ├── servocontrol/             # Dedicated asset directory for Servo Control
        │   └── index.html            # Slider and toggle element matrices
        └── picodiag/                 # Dedicated asset directory for Pico Telemetry
            └── index.html            # Localized scoped alarm threshold diagnostic panel
```

---

## 🛠️ Global Framework Rules

To extend or build new custom pages within this framework, you must follow these architectural practices:

1. **Keep Shared Assets Generic:** Never add hardcoded indices (`IDX`), page-specific selectors, or custom calculations to `hmitiles.js` or `hmitiles.css`. They manage global variables (`DOMOTICZ_URL`) and baseline component layout rules only.
2. **Localize Custom Code Scope:** Encapsulate all page-specific features, data fetches, and threshold scripts inside a private `DOMContentLoaded` closure using block-scoped local variables (`const`). This prevents naming collisions or file overwrites.
3. **Isolate Element Selectors:** Combine HTML5 attributes securely (e.g., `[data-device-idx="22"][data-type="temperature"]`) so data functions always modify the correct UI element when multiple elements share matching index numbers.
4. **Follow High-Performance Design Standards:** Keep runtime graphics neutral (using desaturated grays). Reserve bright, saturated alert colors (amber and red) exclusively for active alarm states to optimize operator awareness and minimize visual clutter.

---

## 📝 Detailed Sub-Module Documentation

For specific setup guides, wiring diagrams, dzVents code files, and MicroPython firmware scripts, please refer to the dedicated documentation pages:

* 📖 **[QUICK_START.md](QUICK_START.md)** - Get up and running in under 2 minutes with local mockups.
* ☀️ **[Solar Info Setup Guide](www/templates/solarinfodashboard/README.md)** - Modbus parameters, Node-RED CSV endpoints, and power tracking metrics.
* ⚙️ **[Servo Control System Guide](www/templates/servocontrol/README.md)** - Virtual dimming slider logic and nanosecond MicroPython socket server details.
* 🌡️ **[PicoDiag Diagnostics Guide](www/templates/picodiag/README.md)** - Silicon ADC temperature equations, background asynchronous curl loops, and JSON payload handling.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

Developed by **Robert W.B. Linn** (c) 2026.
