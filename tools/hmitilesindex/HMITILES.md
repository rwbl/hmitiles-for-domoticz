# Sorted & Grouped Custom Dashboard Index for Domoticz

An elegant, high-density dashboard solution designed specifically for **Domoticz** and optimized for **HMITiles**. 
This project intercepts the default sequentially parsed, unorganized `Custom` dropdown menu in Domoticz and replaces 
it with a beautiful, organized, 2-column flexbox grid index built entirely out of a customizable JSON file.

## Features
* **Structured Custom Navigation:** Group and organize your custom dashboard sub-pages by category instead of scrolling through a long, unsorted dropdown list.
* **Zero External Dependencies:** Native JavaScript framework implementation leveraging absolute path hooks to pull from Domoticz's internal `/js/jquery.min.js`.
* **Fixed-Grid Layout:** Enforces a clean dashboard grid showing a maximum of 2 categorical group boxes per row, complete with a hard-coded vertical footprint and internal scrollbars for lengthy categories.
* **No Iframe Security Context Breaking:** Avoids `404 API Not Found` errors in custom tracking assets (`hmitiles.js`) by navigating windows cleanly without iframe wrappers.

---

## Screenshot
![HMITiles Index](tools/hmitilesindex/hmitilesindex.png)

---

## File Structure

Place your configuration matrix and master index script file directly into your Domoticz backend web distribution template path as follows:

```text
domoticz/www/templates/
├── HMITiles.html         <--- Main index file opened via Domoticz GUI
├── hmitiles.json         <--- Custom configuration layout dictionary
└── your_custom_folders/   <--- Move all your custom panel modules here
    ├── alarmtile/
    │   └── index.html
    └── power_stats/
        └── index.html
```

---

## Step-by-Step Installation

### 1. Create the Configuration File (`hmitiles.json`)
Create a file named `hmitiles.json` inside your `domoticz/www/templates/` directory. Use the snippet schema configuration mapping below to declare your custom categories, sub-page titles, and file paths.

```json
{
  "groups": [
    {
      "category": "Security & Alarms",
      "pages": [
        { "title": "Main House Alarm", "file": "alarmtile/index.html" },
        { "title": "CCTV View Matrix", "file": "cctv/index.html" }
      ]
    },
    {
      "category": "Climate & Environment",
      "pages": [
        { "title": "Living Room Heating", "file": "livingroom/index.html" },
        { "title": "Garden Irrigation", "file": "garden/index.html" }
      ]
    }
  ]
}
```
> **Note:** The `"file"` path parameter string should be relative to the `/www/templates/` root. Do not include a leading slash or `templates/` prefix here.

### 2. Deploy the Dashboard Index File (`HMITiles.html`)
Save your compiled production file exactly at `domoticz/www/templates/HMITiles.html`. When you launch Domoticz and select your page from **Setup/GUI > Custom > HMITiles**, this file automatically builds your grouped responsive tile index matrix.

### 3. Add the Return Navigation to your Sub-Pages
To allow seamless navigation back from individual sub-pages back to your structured grid layout without causing reference crashes (`$` undefined errors) or dropping out of the Domoticz skin framework wrapper context, add a **Return Button Link** inside the top menu bar of your sub-pages (e.g., inside `alarmtile/index.html`):

```html
<!-- Add a return link button mapping to the Domoticz Custom Tab routing framework -->
<button class="hmi-exit-btn" onclick="window.location.href='/#/Custom/HMITiles'">
    HMITiles Index ➔
</button>
```

---

## Adjusting the Dashboard Layout Grid

You can seamlessly change the overall dimensions of your card matrices to adapt to your dedicated display monitors by updating the CSS variables located near the top inside the `<style>` section of your `HMITiles.html` script:

* **To change box height configurations:** Alter the `height: 260px;` integer property under the `.group-box` block selectors.
* **To change layout column parameters:** The `flex: 1 1 calc(50% - 8px);` math calculation splits layout spaces exactly into a **2-column layout pattern**. If you want a 3-column distribution dashboard configuration, adapt this math variable statement block layout parameters to `calc(33.333% - 12px)`.

---

## Troubleshooting Checklist
* **Blank Screen / Infinite Loading Text:** Ensure your configuration file is named exactly `hmitiles.json` (lowercase) and valid JSON notation. Verify your browser's Developer Tool Console (F12) to isolate syntax loading exceptions.
* **404 Page Mismatch Errors:** Make sure your folder destinations match the values set in the JSON configuration dictionary array strings. Keep in mind that paths inside Domoticz environments are strictly case-sensitive.
