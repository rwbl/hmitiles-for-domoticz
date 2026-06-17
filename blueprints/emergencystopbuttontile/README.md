# Emergency Stop (Safety Switch) Blueprint

This document explains how to implement a high-visibility, persistent **Emergency Stop (E-STOP) Button** using the native HMITiles framework infrastructure. 

## The Challenge with Momentary Buttons
In Domoticz, safety devices like an Emergency Stop are often configured as a **Push On Button**. These are momentary switches: when clicked, they briefly fire an `ON` signal to trigger your backend safety script, but their database state instantly reverts or stays `OFF`. 

When a standard monitoring page polls the API, a momentary button will flash red for a second and then instantly revert to a "Normal" state.

## The Pure HTML Solution (No JS Modification Required)
Instead of modifying `hmitiles.js` with complex custom exceptions, we can leverage the built-in `checkAlarmThresholds` engine. By smart-mapping both binary switch possibilities (`0` for OFF, `1` for ON) to a **critical** state response, the tile is mathematically locked into a red warning layout regardless of what Domoticz polls.

### Why It Works:
* When the switch is **OFF** (`rawValue = 0`), it matches `data-level-info="0"` $\rightarrow$ Triggers **Critical**
* When the switch is clicked **ON** (`rawValue = 1`), it matches `data-level-critical="1"` $\rightarrow$ Triggers **Critical**

---

## HTML Implementation Blueprint

Copy and paste this clean block structure directly into your dashboard page template file:

```html
<!-- 
    HMITILES COMPONENT: EMERGENCY STOP PUSH BUTTON
    =========================================================================
    Device Context: Switch / Light/Switch / Push On Button
    Target Action: Sends an "On" execution string command instantly upon click.
    =========================================================================
-->
<div class="hmi-pack-card" 
     data-type="switch" 
     data-device-idx="6" 
     data-action="On" 
     data-on-text="TRIP" 
     data-off-text="TRIP"
     data-alarm-type="up"
     data-level-info="0"     data-text-info="E-STOP"     data-state-info="critical"
     data-level-critical="1" data-text-critical="E-STOP" data-state-critical="critical">
     
    <div class="hmi-card-header">
        <div class="hmi-pack-label">Safety Subsystem / Emergency Control</div>
        <!-- Live Clickable Badge Component Container -->
        <div class="hmi-badge hmi-clickable-badge">E-STOP</div>
    </div>
    
    <div class="hmi-value-grid">
        <div class="hmi-value-box" style="padding: 12px 0;">
            <div class="hmi-box-data" style="text-align: center; width: 100%;">
                <!-- Static Value Text Display -->
                <span class="hmi-value" style="font-weight: bold; letter-spacing: 1px; color: #fff;">
                    EMERGENCY STOP
                </span>
            </div>
        </div>
    </div>
</div>
```

---

## Configuration Parameter Definitions

* `data-device-idx="6"`: Maps directly to the corresponding Hardware Device IDX inside your Domoticz database configuration panel.
* `data-action="On"`: Tells your core event framework to send a strict, instant execution call whenever a user clicks on the card.
* `data-alarm-type="up"`: Instructs the threshold parsing loop to evaluate conditions sequentially looking upward from zero values.
* `data-state-info="critical"`: Forces the wrapper card element to inherit your custom red theme profile (`data-alarm="critical"`) even when sitting completely at standby idle state (`0`).
* `data-state-critical="critical"`: Maintains the high-visibility warning state seamlessly if a live toggle event switches the status registry parameters temporarily to (`1`).
