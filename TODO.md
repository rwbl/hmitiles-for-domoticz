# TODO

---

### The Multi-State Manual Override Selector (Mode Controller)Standard switches are binary (On/Off). 
Industrial control often requires switching between operating modes (Auto, Manual, and Override Standby) for devices like ventilation fans, irrigation systems, or pool pumps.

Visual Blueprint Layout:
```
[Ventilation Control]               [AUTO]
[ AUTO ]    [ MANUAL ]    [ OVERRIDE ]
```

How it works: 
It maps multiple button states to a single Domoticz selector switch or text variable register, changing button border styling instantly via data attributes to 
highlight the active mode.

### The Condensed Matrix Dashboard (Multi-Variable Cluster)
If you have a room with a temperature sensor, humidity sensor, light level sensor, and motion detector, standard setups force you to use 4 separate bulky tiles. 
This tile bundles them cleanly into a single compact square layout.

Visual Blueprint Layout:
```
[Living Room Environmental]         [NORMAL]
Temp: 21.4 °C        | Humidity: 45 %
Lux:  120 lx         | Motion:   CLEAR
```

How it works: 
The hook intercept captures data from 4 distinct incoming IDXs simultaneously in the background and populates the text fields inside a single dashboard card element.

### The Timed Boost Selector (Countdown Trigger)
A dedicated widget built to force a hardware device (like a bathroom exhaust fan or a garden watering valve) into an ON state for a hard-coded duration, 
automatically turning off afterward.

Visual Blueprint Layout:
```
[Enclosure Boost Fan]               [IDLE]
[ 15 Min ]    [ 30 Min ]    [ OFF ]
```

How it works: 
Clicking a button passes an explicit timer variable up to Domoticz, triggering an automated countdown event loop on your backend server architecture.




