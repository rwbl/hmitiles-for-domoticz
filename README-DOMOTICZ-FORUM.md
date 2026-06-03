# HMITiles for Domoticz – Tile-based Custom Pages

Hi everyone,

I’d like to share a small open-source project that might be useful as inspiration for building custom Domoticz pages.

**HMITiles for Domoticz** is a set of HTML/CSS/JS-based custom pages for Domoticz that use a tile-style layout to visualize device data.

The idea is mainly to:
* Apply simple HMI-style design principles (neutral gray states, desaturated alarm alerts)
* Structure information in tiles instead of long lists
* Keep UI logic separate from Domoticz data handling
* Bind elements natively via `data-device-idx`
* Hook custom alerts directly into the global lifecycle without duplicate loop timers
* Allow independent custom pages per use case

It is not a finished product, just an experimental setup that grew out of my B4X HMITiles project.

---

## Screenshots

**Workbench (development / testing area)**  
![Workbench](images/hmitiles-workbench-1.png)
github.com/rwbl/hmitiles-for-domoticz/tree/main/images/workbench-1.png

**SolarInfo example dashboard**  
![Solar dashboard](images/solarinfo-1.png)
github.com/rwbl/hmitiles-for-domoticz/tree/main/images/solarinfo-1.png

---

## Example Custom Pages

* Solar energy overview (production / house / grid / battery)
* Raspberry Pi Pico servo control panel (WiFi-based)
* Raspberry Pi Pico telemetry view (WiFi-based)
* HMITiles workbench for developing and testing tiles

---

## Source

GitHub repository: https://github.com<your-repo-link>

---

Feedback or ideas are welcome.

Best regards,  
Robert W.B. Linn
