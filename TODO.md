# TODO

---

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

