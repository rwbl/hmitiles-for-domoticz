# GET STARTED

## Download
Download the [repository](https://github.com/rwbl/hmitiles-for-domoticz) from GitHub.

## Install
From the repository `hmitiles-for-domoticz-main.zip`, unpack the folders `blueprints` and `core` to the Domoticz folder `www/templates`.

Folder structure (example Ubuntu):
```
/home/username/domoticz/www/templates/blueprints
/home/username/domoticz/www/templates/core
```

## First Tile
Create your first simple tile showing the value of a Domoticz device.

### 1. Domoticz Device
Select a Domoticz device containing a single value or create a new virtual device (like a custom sensor). 
Note the index `idx` of this device.

### 2. HMITile HTML File
In the Domoticz templates folder (`www/templates`), create a new file named `MyFirstTile.html` with the content below. 
This defines an HMITile of device type `value` (`data-type="value"`).

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>HMITiles Values</title>

    <!-- Link backward to reuse shared global common styles -->
    <link rel="stylesheet" href="/templates/core/hmitiles.css">
	
    <!-- Link backward to the HMI tile engine -->
    <!-- Ensure type="module" is declared so the browser resolves the import statement -->
    <script type="module" src="/templates/core/hmitiles.js"></script>
</head>

<body>
    <main class="hmi-panel">
        <div class="hmi-pack-tile hmi-clickable-tile" 
            data-type="value" 
            data-device-idx="1"
            data-labels="0:Data:Unit">
            <div class="hmi-tile-header"><div class="hmi-pack-label">MyCustomSensor</div></div>
            <div class="hmi-value-grid"></div>
            <div class="hmi-last-update" data-field="LastUpdate"></div>
        </div>
    </main>
</body>
</html>
```

### 3. Set IDX
Update the attribute `data-device-idx` with your specific device `idx` inside your `MyFirstTile.html` file. 

*Note: If your sensor displays a specific unit like temperature, you can change `data-labels="0:Data:"` to `data-labels="0:Temperature:°C"`.*

### 4. Show HMITile
To see your first HMITile, do a hard refresh of your browser (**Ctrl + F5**) to clear the cache, then open it from 
the Domoticz **Custom** menu under the submenu **MyFirstTile**.

---

## Configuration Settings

To fine-tune the background polling mechanism, configure the variables at the top of your `hmitiles.js` file.

### Setting the Polling Interval (`REFRESH_RATE`)
JavaScript timing loops (`setInterval`) expect intervals to be declared explicitly in **milliseconds**. 

Setting this too low will overload your web server, while setting it using seconds (e.g., `60`) will freeze your browser tab by hammering the network every 60 milliseconds.

```javascript
// =========================================================================
// CORE CONFIGURATION CONSTANTS
// =========================================================================

// Background poll rate for device updates. Must be in MILLISECONDS.
// 10000 = 10 seconds | 30000 = 30 seconds | 60000 = 1 minute
const REFRESH_RATE = 60000; 
```

---

