# THEMEDARK

**Data Type**: All data-types supported.

---

## Overview
Experimental dark theme for the HMITiles.

**Preview**
![Theme Dark](themedark.png)

**IMPORTANT**
Lookup `index.html` for latest examples.

## Configuration Parameters 

Include `/templates/hmitiles/core/hmitiles-dark.css` in the HTML `head` section.
Add class for dark theme to the body tag `body class="theme-dark.`

## Template Implementations

```
<head>
    <meta charset="UTF-8">
    <title>HMITiles Theme Dark (Experimental)</title>

    <!-- Link backward to reuse shared global common styles -->
    <link rel="stylesheet" href="/templates/hmitiles/core/hmitiles.css">
    <link rel="stylesheet" href="/templates/hmitiles/core/hmitiles-dark.css">
	
	<!-- Link backward to the HMI tile engine -->
	<!-- Ensure type="module" is declared so the browser resolves the import statement -->
	<script type="module" src="/templates/hmitiles/core/hmitiles.js"></script>
</head>


<!-- Add the class for dark mode -->
<body class="theme-dark">

	<header class="hmi-header-container">
		<div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
			<div style="display: flex; align-items: center; gap: 15px;">
				<button class="hmi-exit-btn" onclick="goToDomoticzDashboard()">&#9664; Main Menu</button>
				<h2>HMITiles Theme Dark (Experimental)</h2>
			</div>
			<div>
				<button class="hmi-exit-btn" onclick="goToHMITilesIndex()">HMITiles Index &#9654;</button>
			</div>
		</div>
	</header>


	<main class="hmi-panel">
    
		<div class="hmi-pack-tile hmi-clickable-tile" 
			data-type="value" 
			data-device-idx="2"
			data-labels="0:VALUE:UNIT">
			<div class="hmi-tile-header"><div class="hmi-pack-label">Custom Sensor</div></div>
			<div class="hmi-value-grid"></div>
		</div>
...
```