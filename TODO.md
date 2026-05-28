# TODO

---

## Dynamic HTML with IDXs 
(Using Data Attributes)
Cannot use standard JavaScript constants inside a static HTML file. 
However, use HTML5 Data Attributes. 
This keeps your code clean and manageable.

How to do it: 
Add data-idx="5" to your HTML cards instead of hardcoding IDs.

The Benefit: 
The generic JavaScript can loop through the page, find every element with a data-idx, and fetch the data automatically.


## Embedding Domoticz GraphsYes
This is completely possible! 
Domoticz provides a native URL endpoint for charts that can be loaded directly into the page using an HTML <iframe> tag.

Option A (Bottom of Page): 
Add a hidden <iframe> at the bottom. 
When a user clicks a tile, use JS to change the frame's URL to that device's log page.

Option B (Trend Page): 
Create a trends.html page using the same 4x3 grid layout. 
Replace the text value spans inside the boxes with small, live graph frames.

## JavaScript Documentation Standards
The absolute standard for documenting JavaScript is JSDoc. 
It uses specific comment tags right above the functions. 
Many code tools use these comments to generate official help websites automatically.Example of JSDoc styling:
```
/**
 * Opens the native Domoticz graph chart for a specific device.
 * @param {number} idx - The unique Domoticz hardware device ID.
 * @returns {void}
 */
function openDomoticzChart(idx) {
    const logUrl = `${DOMOTICZ_BASE_URL}/#/Devices/${idx}/Log`;
    window.open(logUrl, '_blank');
}
```

## 4. Creating a Master Tile Template File
Creating a template file (hmitiles.index or a master HTML file) is a great way to show users how to build different types of cards. 
Include clean examples of a standard value tile, a battery state-of-charge gauge, a push-button switch, and a text display tile 
so others can easily copy and paste them.

