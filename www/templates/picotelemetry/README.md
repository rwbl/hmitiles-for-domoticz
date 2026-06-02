# Project Summary: PicoDiag Telemetry & Control Platform

A high-performance, resilient end-to-end IoT platform that displays real-time controller diagnostics using custom industrial-grade dashboards.

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

 |  Physical Hardware     |                       |  ISA-101 High-Perf HMI |
 | - Onboard Core Temp    |                       | - 24-Hour Sparklines   |
 | - CYW43439 Wi-Fi RSSI  |                       | - Dynamic Alert Badges |
 +------------------------+                       +------------------------+
```

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
* Scope Protection: Encapsulates initialization variables as local arrow functions within private DOMContentLoaded container bounds to prevent conflicts with global scripts.
* Automated Background Polling: Runs a private background loop (setInterval) that updates the page automatically every 60 seconds without forcing page reloads.
* Manual Refresh Integration: Includes a top-right header button that links to the data-fetch chain, providing direct layout updates on demand.

---

## Configured Monitoring Parameters

* Silicon Processor Temp (IDX 22)
  - Rules: Normal / Low Warning (>= 22°C) / Critical (>= 23°C)
  - Elements: Numeric Value Box & 24h SVG Sparkline

* System Timestamp (IDX 23)
  - Rules: Formatted explicitly to HH:MM from array endpoints
  - Elements: Monospace Update Cell

* Wi-Fi Attenuation RSSI (IDX 24)
  - Rules: Mapped from raw numbers to explicit network status
  - Elements: Multiline Information Box

---
