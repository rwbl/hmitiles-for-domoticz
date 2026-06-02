# Domoticz-HMITiles – Tile-based Custom Pages

Hi everyone,

I’d like to share a small open-source project that might be useful as inspiration for building custom Domoticz pages.

**Domoticz-HMITiles** is a set of HTML/CSS/JS-based custom pages for Domoticz that use a tile-style layout to visualize device data.

The idea is mainly to:
- Apply simple HMI-style design principles
- Structure information in tiles instead of long lists
- Keep UI logic separate from Domoticz data handling
- Bind elements via `data-device-idx`
- Keep the visuals minimal, with optional alarm highlighting
- Allow independent custom pages per use case

It is not a finished product, just an experimental setup that grew out of my B4X HMITiles project.

---

## Screenshots

**Workbench (development / testing area)**  
![Workbench](images/domoticz-hmitiles-workbench-1.png)

**SolarInfo example dashboard**  
![Solar dashboard](images/domoticz-hmitiles-solarinfo-1.png)

---

## Example Custom Pages

- Solar energy overview (production / house / grid / battery)
- Raspberry Pi Pico servo control panel (WiFi-based)
- Raspberry Pi Pico telemetry view (WiFi-based)
- HMITiles workbench for developing and testing tiles

---

## Source

GitHub repository: https://github.com/<your-repo-link>

---

Feedback or ideas are welcome.

Best regards,  
Robert W.B. Linn
