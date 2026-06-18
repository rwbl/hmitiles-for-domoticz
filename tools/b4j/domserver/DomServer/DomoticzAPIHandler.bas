B4J=true
Group=Default Group
ModulesStructureVersion=1
Type=Class
Version=2.18
@EndOfDesignText@
' Class Module: DomoticzAPIHandler
' Brief:        Intercepts incoming browser streams, reads request parameters, 
'               and builds native JSON response payload maps dynamically.
' Description:	Key Engineering Insights 
'				- Added To this CodeThread Isolation & Class Scope: In B4J jServer, each request runs on its own background thread. 
'				- Placing fields inside handlers Or separate methods keeps memory safe And prevents cross-device data contamination.
'				- True API Type Emulation: The simulator uses actual Domoticz keys like svalue, Data, And Type To verify your parsing Loop engine (device.Type === 'Wind') executes seamlessly without code branching.
'				- Implicit Variable Casting: B4J manages string casting automatically. Writing deviceMap.Put("Data", "1200") explicitly defines it as a text string, matching how the browser receives data over real hardware ports.

Sub Class_Globals
	' Variables declared inside Class_Globals are local to each unique instance
	' of this class that the server creates to handle incoming requests.
End Sub

' The initialization constructor code triggered automatically by the jServer routing container
Public Sub Initialize
	' Instantiation parameters can be placed here if needed at a later date
End Sub

' Handle
' The master structural entry point triggered by Jetty whenever a URL match Is detected.
' This function processes requests on separate worker background threads asynchronously.
' @param req  - Holds incoming connection details, headers, And query string parameter parameters.
' @param resp - Controls what Is written back To the browser user-interface screen.
Sub Handle(req As ServletRequest, resp As ServletResponse)
    
	' -------------------------------------------------------------------------
	' 1. CROSS-ORIGIN RESOURCE SHARING (CORS) SECURITY EXEMPTION RULES
	' -------------------------------------------------------------------------
	' By default, modern browsers block web pages on one domain (or local file:// paths)
	' from executing fetch/XHR calls to an entirely different server domain/port.
	' To prevent "CORS Blocked" errors on your dashboard workbench layout face:
	resp.SetHeader("Access-Control-Allow-Origin", "*")    ' Allows ANY domain/origin to fetch data from this server
	resp.SetHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS") ' Authorizes standard web request verbs
    
	' 2. ENFORCE FORMAL CONTENT-TYPE SPECS
	' Explicitly warns the browser rendering engine that the incoming byte payload
	' is structured JSON text metadata using universal UTF-8 text character definitions.
	resp.ContentType = "application/json;charset=UTF-8"
    
	' -------------------------------------------------------------------------
	' 3. EXTRACT INCOMING DOMOTICZ URL QUERY STRING TOKENS
	' -------------------------------------------------------------------------
	' Example URL parsed: /json.htm?type=command&param=getdevices&rid=5&filter=all
	Dim commandType As String = req.GetParameter("type")   ' Expecting: "command"
	Dim paramType   As String = req.GetParameter("param")  ' Expecting: "getdevices"
	Dim ridString   As String = req.GetParameter("rid")    ' Expecting: "5", "12", "31", etc.
	Dim filterType  As String = req.GetParameter("filter") ' Expecting: "all" or null
    
	' Output structured diagnostic traces straight to your B4J command terminal interface
	Log($"[INCOMING REQUEST EVENT] type=${commandType}, param=${paramType}, rid=${ridString}, filter=${filterType}"$)
    
	' -------------------------------------------------------------------------
	' 4. ROUTING MATRIX CONDITION EVALUATION
	' -------------------------------------------------------------------------
	' Ensure the request strictly matches Domoticz hardware tracking api signatures
	If commandType = "command" And paramType = "getdevices" Then
        
		Dim jsonResponse As String = ""
        
		' CHECK THE SCOPE: Is the frontend fetching ALL devices or just ONE specific hardware ID?
		If filterType = "all" Then
			' User dashboard is running a full initial population payload fetch query loop
			jsonResponse = GenerateAllMockDevices
		Else
			' User dashboard is targetedly tracking one specific isolated hardware item index number
			jsonResponse = GenerateSingleDeviceData(ridString)
		End If
        
		' Send the resulting string back over the live active network pipeline interface socket
		resp.Write(jsonResponse)
        
	Else
		' Fallback wrapper safely returned if a different query type is run
		Log("⚠️  Warning: Received an unmapped or invalid api request route string signature profile.")
		resp.Write("{""status"" : ""ERR_UNSUPPORTED_COMMAND"", ""message"":""The simulator handles type=command&param=getdevices""}")
	End If
End Sub

' GenerateAllMockDevices 
' Compiles a full JSON database Array packet containing every mock testing device node.
' This populates your whole layout screen with simulated records simultaneously.
Private Sub GenerateAllMockDevices As String
	' B4J Maps represent key-value dictionaries. They translate seamlessly into JSON objects {}
	Dim resultRoot As Map
	resultRoot.Initialize
	resultRoot.Put("status", "OK")
	resultRoot.Put("title", "GetDevices")
    
	' B4J Lists represent ordered zero-indexed lists. They translate into JSON arrays []
	Dim resultList As List
	resultList.Initialize
    
	' =========================================================================
	' DEVICE 1: SOLAR GENERATION MATRIX TILE (Upward Scaling Range Test Case)
	' =========================================================================
	Dim solarMap As Map
	solarMap.Initialize
	solarMap.Put("idx", "5")
	solarMap.Put("Name", "Solar Generation")
	solarMap.Put("Type", "Usage")
	solarMap.Put("Data", "1252")                     ' 1252 Watts matches your "LOW" warning tier test rules
	solarMap.Put("Status", "1252 Watt")
	solarMap.Put("LastUpdate", "2026-06-16 11:30:00")
	resultList.Add(solarMap)                         ' Push object into the array tracker list
    
	' =========================================================================
	' DEVICE 2: SYSTEM BATTERY SOC TILE (Downward Drainage Drop-off Test Case)
	' =========================================================================
	Dim batteryMap As Map
	batteryMap.Initialize
	batteryMap.Put("idx", "12")
	batteryMap.Put("Name", "System Battery SOC")
	batteryMap.Put("Type", "Usage")
	batteryMap.Put("Data", "100")                    ' 100% matches your "FULL" normal tier test rules
	batteryMap.Put("Status", "100 %")
	batteryMap.Put("LastUpdate", "2026-06-16 11:30:00")
	resultList.Add(batteryMap)
    
	' =========================================================================
	' DEVICE 3: AIR QUALITY MONITOR TILE (Generic 5-Level Alarm Hierarchy Test)
	' =========================================================================
	Dim airMap As Map
	airMap.Initialize
	airMap.Put("idx", "31")
	airMap.Put("Name", "Air Quality Monitor")
	airMap.Put("Type", "Air Quality")
	airMap.Put("Data", "1200")                    ' 1200 PPM matches your "Mediocre" / yellow warning rules
	airMap.Put("Status", "1200 PPM")
	airMap.Put("LastUpdate", "2026-06-16 11:30:00")
	resultList.Add(airMap)
    
	' =========================================================================
	' DEVICE 4: STANDALONE WIND ENVIRONMENT STATION TILE (Semicolon Composite String)
	' =========================================================================
	Dim windMap As Map
	windMap.Initialize
	windMap.Put("idx", "45")
	windMap.Put("Name", "Weather Station Wind")
	windMap.Put("Type", "Wind")
	' Schema layout mapping parameters: WB;WD;WS;WG;22;24 (Bearing, Direction, Speed, Gust, Temp, Chill)
	windMap.Put("Data", "180;S;100;150;180;210")   ' Raw values magnified by 10 per Domoticz expectations
	windMap.Put("svalue", "180;S;100;150;180;210")
	windMap.Put("LastUpdate", "2026-06-16 11:30:00")
	resultList.Add(windMap)

	' Nest the array tracker list inside the root map object dictionary key value field
	resultRoot.Put("result", resultList)
    
	' -------------------------------------------------------------------------
	' JSON SERIALIZATION CONVERSION LAYER
	' -------------------------------------------------------------------------
	' The JSONGenerator library processes complex multi-tiered Map/List structures
	' and stringifies them into clean, network-legal transmission data payloads.
	Dim jsonGen As JSONGenerator
	jsonGen.Initialize(resultRoot)
	Return jsonGen.ToString
End Sub

' GenerateSingleDeviceData
' Handles single-item discrete lookups when the frontend requests data For an individual target IDX marker.
Private Sub GenerateSingleDeviceData(idx As String) As String
	Dim resultRoot As Map
	resultRoot.Initialize
	resultRoot.Put("status", "OK")
	resultRoot.Put("title", "GetDevices")
    
	Dim resultList As List
	resultList.Initialize
    
	Dim deviceMap As Map
	deviceMap.Initialize
	deviceMap.Put("idx", idx)
	deviceMap.Put("LastUpdate", "2026-06-16 11:30:00")
    
	' Evaluate incoming lookup code and conditionally construct matching key metrics
	Select Case idx
		Case "5"
			deviceMap.Put("Name", "Solar Generation")
			deviceMap.Put("Type", "Usage")
			deviceMap.Put("Data", "1252")
			deviceMap.Put("Status", "1252 Watt")
		Case "12"
			deviceMap.Put("Name", "System Battery SOC")
			deviceMap.Put("Type", "Usage")
			deviceMap.Put("Data", "100")
			deviceMap.Put("Status", "100 %")
		Case "31"
			deviceMap.Put("Name", "Air Quality Monitor")
			deviceMap.Put("Type", "Air Quality")
			deviceMap.Put("Data", "1200")
			deviceMap.Put("Status", "1200 PPM")
		Case Else
			deviceMap.Put("Name", "Generic Secondary Node")
			deviceMap.Put("Type", "General")
			deviceMap.Put("Data", "0")
			deviceMap.Put("Status", "OK")
	End Select
    
	resultList.Add(deviceMap)
	resultRoot.Put("result", resultList)
    
	Dim jsonGen As JSONGenerator
	jsonGen.Initialize(resultRoot)
	Return jsonGen.ToString
End Sub
