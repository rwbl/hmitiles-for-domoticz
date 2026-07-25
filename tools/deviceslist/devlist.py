import json
import urllib.request

# Configuration
DOMOTICZ_URL = (
    "http://127.0.0.1:8080/json.htm?type=command&param=getdevices&filter=all"
)


def fetch_domoticz_devices():
    try:
        # Send HTTP request
        with urllib.request.urlopen(DOMOTICZ_URL) as response:
            if response.status == 200:
                # Load JSON data
                data = json.loads(response.read().decode())

                # Validate response structure
                if data.get("status") == "OK" and "result" in data:
                    return data["result"]
                else:
                    print("Error: Invalid Domoticz response status.")
            else:
                print(f"HTTP Error: Status {response.status}")
    except Exception as e:
        print(f"Connection Error: {e}")
    return []


# Fetch and extract the selected data
devices = fetch_domoticz_devices()

# SORT MATRIX: Sorts primarily by 'Type', and secondarily by 'SubType'
# Uses .get() with "" fallback to prevent crashing on missing keys
devices.sort(key=lambda x: (x.get("Type", ""), x.get("SubType", "")))

# Print List
print("TYPE, SUBTYPE, SWITCHTYPE || IDX, NAME, DATA")
print("=============================================")
for device in devices:
    # Extract only the selected fields you need
    dev_idx = device.get("idx")
    dev_name = device.get("Name")
    hardware_id = device.get("HardwareID")
    dev_type = device.get("Type")
    sub_type = device.get("SubType")
    switch_type = device.get("SwitchType")
    dev_data = device.get("Data")
    
    # Example output format
    print(f"{dev_type}, {sub_type}, {switch_type} || {dev_idx}, {dev_name}, '{dev_data}'")
    # print(f"ID: {idx} | Name: {name} | Type: {dev_type} | SubType: {sub_type} | SwitchType: {switch_type}")
