# 🛠️ Domoticz HMITiles Server Simulator Backend (B4J)

This lightweight, multi-threaded console application simulates a live Domoticz home automation server. Built with B4J, it intercepts standard dashboard API web fetch loops and dynamically processes JSON payloads to populate custom HMITiles components during offline workbench development.

---

## 🚀 Quick Start & Project Prerequisites

1. **Add B4J Reference Libraries**: Before compiling the project inside your B4J IDE, ensure you navigate to the **Libs** tab on the bottom right and check:
   * `jServer` (Handles the network socket engine and concurrent HTTP thread loop)
   * `JSON` (Handles mapping dictionaries and compiling transmission payloads)
2. **Compile the App**: Run the project as a console application. The server immediately binds to network socket listener port `8080`.
3. **Terminate Securely**: To close background server networks safely, press `Ctrl+C` inside your open terminal window console host.

---

## 🌐 Hosting Your HTML Custom Dashboard (`www` Pipeline)

The embedded Jetty server engine natively provides a static web content compiler pathway. This allows you to host and test your frontend dashboard code without dealing with local file asset sandbox security restrictions (`file://`).

1. Compile and boot the B4J server program once. This automatically creates a deployment directory tree structure inside your project build workspace:
   `...\DomServer\Objects\www\`
2. Copy your front-end user-interface source assets directly into that newly generated folder location:
   * `index.html`
   * `hmitiles.js`
   * `hmitiles.css`
3. **🔴 CRITICAL WEBSOCKET REQUIREMENT**: If you extend your connection pipeline to utilize asynchronous WebSocket connectivity features, you **must ensure** that the B4J internal companion asset library file **`b4j_ws.js`** is placed right inside this same `www` root folder directory. Your custom script layers depend on this script to handshake cleanly with the backend socket routes.
4. Launch your browser and navigate directly to the host network address:
   `http://127.0.0`

*Note: Your `hmitiles.js` fetch engine should resolve its network tracking loop dynamically using `window.location.host` to support zero-configuration deployments across varying network addresses.*

---

## ⚙️ Simulated API Call Syntax & Routes

The simulator backend monitors standard structural query strings natively. It injects Cross-Origin Resource Sharing (`CORS`) security headers automatically so any local web test runner can query metrics securely.

### 1. Global Batch Payload Fetch Request
Used during dashboard initialization sequences to query state statuses for every active hardware node on a single pass.
* **Request URL Endpoint**:  
  `http://127.0.0`
* **Response Payload Struct**:  
  ```json
  {
    "status": "OK",
    "title": "GetDevices",
    "result": [
      {
        "idx": "5",
        "Name": "Solar Generation",
        "Type": "Usage",
        "Data": "1252",
        "Status": "1252 Watt",
        "LastUpdate": "2026-06-16 11:30:00"
      },
      {
        "idx": "12",
        "Name": "System Battery SOC",
        "Type": "Usage",
        "Data": "100",
        "Status": "100 %",
        "LastUpdate": "2026-06-16 11:30:00"
      }
    ]
  }
  ```

### 2. Isolated Single-Device Hardware Lookup Query
Used during runtime live-polling sequences to track refresh parameters for one explicit device indicator tile using its unique index value string (`rid`).
* **Request URL Endpoint**:  
  `http://127.0.0`
* **Response Payload Struct**:  
  ```json
  {
    "status": "OK",
    "title": "GetDevices",
    "result": [
      {
        "idx": "5",
        "LastUpdate": "2026-06-16 11:30:00",
        "Name": "Solar Generation",
        "Type": "Usage",
        "Data": "1252",
        "Status": "1252 Watt"
      }
    ]
  }
  ```

---

## 🧪 Expanding Test Cases (Data Matrix)

To simulate specific sensor warnings, alarm thresholds, or weather updates, open the `DomoticzAPIHandler` class module within B4J and alter the `Data`, `svalue`, or `Type` dictionary entries inside the `Select Case idx` blocks. 

This lets you test critical battery drainage states or severe wind storm warning badge flags effortlessly without needing access to real physical smart home sensors.
