# Blueprint Pico Telemetry View

A high-performance, resilient end-to-end IoT platform that displays real-time controller diagnostics using custom industrial-grade dashboards.

---

## Screenshots

![Pico Telemetry View](pico-telemetry-view.png)

---


## Core Architecture Overview
```
                                   HTTP JSON
 +------------------------+     (Port 80 GET)     +------------------------+
 |     Raspberry Pi       | <===================> |     Domoticz Home      |
 |    Pico WH Node        |                       |   Automation Server    |
 | (MicroPython WebServer)|                       |    (dzVents Engine)    |
 +-----------+------------+                       +-----------+------------+

             |                                                |
             | Internal Volts / ADC                           | JSON Polling Loop
             v                                                v
 +------------------------+                       +------------------------+
 |  Physical Hardware     |                       |      High-Perf HMI     |
 | - Onboard Core Temp    |                       | - 24-Hour Sparklines   |
 | - CYW43439 Wi-Fi RSSI  |                       | - Dynamic Alert Badges |
 +------------------------+                       +------------------------+
```

---

---

## Layer Implementation Details

### 1. Embedded Layer (MicroPython Firmware)
* Hardware Target: Raspberry Pi Pico WH.
* Network Listener: Features a custom TCP socket server running continuously on port 80.
* Telemetry Generation: Translates internal silicon voltage tracking channels (ADC 4) into accurate Celsius steps.
* Network Visibility: Pulls active received signal strength indications (wlan.status('rssi')) dynamically from the Wi-Fi chip antenna.
* Resilience Profile: Implements a background self-healing network handler. If a connection drops, it cuts processing lines, blinks the status LED, and automatically repairs the connection.
* Memory Optimization: Packages multi-variable datasets into raw string structures to avoid loading heavy object libraries.
  Example payload: {"temp": 21.4, "rssi_dbm": -81}

### 2. Controller Layer (Domoticz & dzVents Engine)
* Polling System: Wakes up asynchronously every 5 minutes using an un-trackable system timer schedule.
* Decoupled Transfers: Executes standard Linux background utility tasks (curl -s -m 2) to grab plaintext variables without causing system stutters.
* Native JSON Parsing: Utilizes domoticz.utils.fromJSON() helper trees to validate strings before updating database registers.
* Signal Mapping: Translates decibel attenuation ranges into clean descriptive status parameters inside a designated text virtual device.

### 3. Interface Layer (Custom HMI Tiles Page)
* Compliance Standards: Designed strictly to ISA-101 High-Performance HMI Situational Awareness concepts, minimizing user fatigue by utilizing gray tones and desaturated color changes.
* Unified Life-cycle Architecture: Completely avoids running isolated `DOMContentLoaded` handlers or duplicate `setInterval` polling loops.
* Centralized Data Hooking: Intercepts incoming Domoticz payloads at the very top of the central `hmitiles.js` sequence using the `window.onHMITileProcess` framework callback.
* Infinite Loop Prevention: Uses state-change memory gates (`lastPushedTime`) to verify timestamp string changes before updating virtual registers, preventing infinite query crashes.
* Asynchronous Asset Streaming: Renders sparkline data coordinates over a 24-hour range directly onto target layout panels on the fly.

---

## Configured Monitoring Parameters

* Silicon Processor Temp (IDX 22)
  - Rules: Normal / Low Warning (>= 22°C) / Critical (>= 23°C)
  - Layout Elements: Numeric Value Box and a separate 24h SVG Sparkline Box target container mapped via `data-chart-idx="22"`

* System Timestamp (IDX 23)
  - Rules: Extracted to "HH:MM" strings from historical logging objects and pushed to virtual text fields
  - Layout Elements: Monospace Text Update Cell mapped via `data-device-idx="23"`

* Wi-Fi Attenuation RSSI (IDX 24)
  - Rules: Dual-class tracking layer checks for `.hmi-value` and `.hmi-value-display` classes
  - Layout Elements: Multiline Information Box mapped via `data-device-idx="24"`

---
