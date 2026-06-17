### 🚨 Universal Alarm Tile Blueprint (Multi-Directional 5-Level Engine)

The **Alarm Tile** is a multi-purpose component driven by a completely generic background engine loop. 
By defining a directional tracking type (`up` or `down`), the same tile skeleton can handle ascending hazard spikes (e.g., Air Quality, Temperature), 
ascending production milestones (e.g., Solar Generation), or descending utility drops (e.g., Battery SOC drainage).

#### ✨ Configuration Parameters (HTML Data Attributes)

| Attribute | Expected Value | Description |
| :--- | :--- | :--- |
| `data-alarm-type` | `up` or `down` | Determines calculation direction. Use `up` if high numbers mean alerts or milestones. Use `down` if falling numbers mean drainage/alerts. |
| `data-level-[tier]` | `Number` | The absolute metric threshold boundary marker value. |
| `data-text-[tier]` | `String` | The custom uppercase status string to print on the interactive `.hmi-badge`. |
| `data-state-[tier]` | `normal`, `warning`, `critical` | Dictates the high-performance UI alert tint response applied to the tile card body. |

> **Available Tier Slots**: `critical`, `high`, `medium`, `low`, `info`, and `normal` (for the baseline fallback text).

---

#### 🛠️ HTML Template Implementation Examples

##### 1. Ascending Spikes (Air Quality / Hazards)
*Tracks upward. Higher numbers worsen the condition, triggering alerts at higher stages.*

```html
<div class="hmi-pack-card" data-type="alarm" data-device-idx="31" data-alarm-type="up"
     data-level-info="0"        data-text-normal="Excellent"   data-state-normal="normal"
     data-level-low="700"       data-text-info="Good"          data-state-info="normal"
     data-level-medium="900"    data-text-low="Fair"           data-state-low="normal"
     data-level-high="1100"     data-text-medium="Mediocre"    data-state-medium="warning"
     data-level-critical="1600" data-text-high="Bad"           data-state-high="critical">
	<div class="hmi-card-header">
		<div class="hmi-pack-label">Air Quality Monitor</div>
		<div class="hmi-badge hmi-clickable-badge">EXCELLENT</div>
	</div>
	<div class="hmi-value-grid"><div class="hmi-value-box"><div class="hmi-box-data"><span class="hmi-value">--</span></div></div></div>
</div>
```

##### 2. Ascending Generation (Solar Production / Milestones)
*Tracks upward. Higher numbers are optimal, meaning lower values trigger caution warnings.*

```html
<div class="hmi-pack-card" data-type="alarm" data-device-idx="5" data-alarm-type="up"
	data-level-info="0"          data-text-info="NO PROD"      data-state-info="warning"
	data-level-low="1000"        data-text-low="LOW"           data-state-low="warning"
	data-level-medium="2000"     data-text-medium="MEDIUM"     data-state-medium="normal"
	data-level-high="3000"       data-text-high="GOOD"         data-state-high="normal"
	data-level-critical="5000"   data-text-critical="VERY GOOD" data-state-critical="normal"
	data-text-normal="NORMAL">			
	<div class="hmi-card-header">
		<div class="hmi-pack-label">Solar Generation</div>
		<div class="hmi-badge">NORMAL</div>
	</div>
	<div class="hmi-value-grid"><div class="hmi-value-box"><div class="hmi-box-data"><span class="hmi-value">--</span></div></div></div>
</div>
```

##### 3. Descending Drainage (System Battery SOC)
*Tracks downward. Lower numbers drop through thresholds, triggering alerts as depletion worsens.*

```html
<div class="hmi-pack-card" data-type="alarm" data-device-idx="12" data-alarm-type="down"
	data-level-critical="0"   data-text-critical="Empty"     data-state-critical="critical"
	data-level-low="25"        data-text-low="QUARTER"       data-state-low="warning"
	data-level-medium="50"     data-text-medium="HALF"       data-state-medium="normal"
	data-level-high="75"       data-text-high="3QUARTERS"    data-state-high="normal"
	data-level-info="100"      data-text-info="FULL"         data-state-info="normal"
	data-text-normal="Normal">
	<div class="hmi-card-header">
		<div class="hmi-pack-label">System Battery SOC</div>
		<div class="hmi-badge">NORMAL</div>
	</div>
	<div class="hmi-value-grid"><div class="hmi-value-box"><div class="hmi-box-data"><span class="hmi-value">--</span></div></div></div>
</div>
```

## Alarm States Text Other

### Option 1: Clean & Technical
This option uses precise, professional terms that align perfectly with energy generation 
```
data.data-text-info="NO PROD." (No Production)
data-text-low="LOW"
data-text-medium="MODERATE"
data-text-high="OPTIMAL"
data-text-critical="PEAK"
```

### Option 2: Simple & IntuitiveThese short, high-contrast words are incredibly easy to read at a quick glance.
```
data-text-info="OFF"data-text-low="WEAK"
data-text-medium="NORMAL"
data-text-high="GOOD"
data-text-critical="MAX"
```

### Option 3: Action-Oriented (Consumption Focus)
These terms help immediately know how much household load your solar system can currently sustain.
```
data-text-info="IDLE"
data-text-low="BASELOAD" (Covers standby devices)
data-text-medium="ACTIVE" (Covers small appliances)
data-text-high="SURPLUS" (Great time to run dishwasher/laundry)
data-text-critical="OVERFLOW" (Perfect time to charge an EV or battery)
```
