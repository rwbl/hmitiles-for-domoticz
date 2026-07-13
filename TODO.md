# TODO

---

### Pre-Parser Devices
Add more devices to the pre-parser (hmitiles-preparser.js).
#### Status
In progress.

### Developer Documentation
Create documentation how to develop this project further.
#### Status
In progress.

### Multi-State Manual Override Selector (Mode Controller)
Industrial control often requires switching between operating modes (Auto, Manual, and Override Standby) for devices like ventilation fans, irrigation systems, or pool pumps.
Standard switches are binary (On/Off). 

Visual Blueprint Layout:
```
[Ventilation Control]     [AUTO]
[ AUTO ]    [ MANUAL ]    [ OVERRIDE ]
```
#### How it works
It maps multiple button states to a single Domoticz selector switch or text variable register, changing button border styling instantly via data attributes to 
highlight the active mode.
#### Status
Not Started.

### Condensed Matrix Dashboard (Multi-Variable Cluster)
If you have a room with a temperature sensor, humidity sensor, light level sensor, and motion detector, standard setups force you to use 4 separate bulky tiles. 
This tile bundles them cleanly into a single compact square layout.

Visual Blueprint Layout:
```
[Living Room Environmental] [NORMAL]
Temp: 21.4 °C        |      Humidity: 45 %
Lux:  120 lx         |      Motion:   CLEAR
```
#### How it works
The hook intercept captures data from 4 distinct incoming IDXs simultaneously in the background and populates the text fields inside a single dashboard card element.

### Timed Boost Selector (Countdown Trigger)
A dedicated widget built to force a hardware device (like a bathroom exhaust fan or a garden watering valve) into an ON state for a hard-coded duration, 
automatically turning off afterward.

Visual Blueprint Layout:
```
[Enclosure Boost Fan]    [IDLE]
[ 15 Min ]    [ 30 Min ]    [ OFF ]
```
#### How it works
Clicking a button passes an explicit timer variable up to Domoticz, triggering an automated countdown event loop on your backend server architecture.
#### Status
Not Started.

### Center-Zero Grid Balance Tile (Import vs. Export)
A unified directional energy widget built to replace separate production and consumption counters, 
providing a clear visual representation of power direction relative to a center-zero point.

Visual Blueprint Layout:
```
[Grid Balance Monitor]          [EXPORT]
<■■■■■■■■■■           |           ]
[ -2.4 kW ]                     [GREEN]
```
#### How it works
The script evaluates a single positive/negative grid value. 
If negative (exporting), the progress bar extends left from the center line in green; 
if positive (importing), it extends right in orange/red.
#### Status
Not Started.

### System Health Alert Matrix (Dead Man Switch)
A silent, high-density maintenance aggregator designed to monitor hardware battery levels and communication timeouts across multiple background nodes without cluttering the screen.

Visual Blueprint Layout:
```
[System Node Monitor]            [ALERT]
[IDX 42: TIMEOUT]   [IDX 105: LOW BATT]
[ 2 Anomalies Found ]           [ORANGE]
```
#### How it works
The polling engine scans an array of critical IDXs. 
It remains completely neutral when data checks pass, 
but instantly drops dynamic monospace alert tags onto the tile if an anomaly is detected.
#### Status
Not Started.

### 3-Phase Load Balance Gauge
A stacked triple-bar monitoring tile engineered specifically for multi-phase electrical setups to display live power distribution and catch hazardous load asymmetry across lines at a glance.

Visual Blueprint Layout:
```
[Phase Distribution]         [HEAVY]
L1: [■■■■■■■■■■■■■■■■■■■     4.2kW ]
L2: [■■■                     0.6kW ]
L3: [■■                      0.4kW ]
```
#### How it works
The parsing loop extracts values from three distinct phase sub-IDXs simultaneously, 
stacking three compact matching bars into a single tile container to reveal balance issues instantly.
#### Status
Not Started.
