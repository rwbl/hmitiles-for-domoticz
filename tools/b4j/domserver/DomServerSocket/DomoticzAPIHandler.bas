B4J=true
Group=Default Group
ModulesStructureVersion=1
Type=Class
Version=2.18
@EndOfDesignText@
' Class Module: DomoticzAPIHandler
' Brief: Clean, simple, and tested HTTP Router. 
'        No complex sockets. Works natively with your 3-second timer polls.

Sub Class_Globals
	' Stateless request container definitions
End Sub

Public Sub Initialize
	' Constructor
End Sub

Sub Handle(req As ServletRequest, resp As ServletResponse)
	' 1. Authorize your browser window to communicate freely with this port
	resp.SetHeader("Access-Control-Allow-Origin", "*")
	resp.SetHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	resp.ContentType = "application/json;charset=UTF-8"
    
	' 2. Extract incoming parameters natively
	Dim commandType As String = req.GetParameter("type")
	Dim paramType   As String = req.GetParameter("param")
	Dim ridString   As String = req.GetParameter("rid")
	Dim filterType  As String = req.GetParameter("filter")
    
	Dim idxUpdate   As String = req.GetParameter("idx")
	Dim sValueStr   As String = req.GetParameter("svalue")
    
	Log($"[HTTP REQUEST EVENT] type=${commandType}, param=${paramType}"$)
    
	' 3. Core Routing Logic
	If commandType = "command" Then
        
		' PATHWAY A: READ MODE (Fired automatically every 3 seconds by the JavaScript timer)
		If paramType = "getdevices" And filterType = "all" Then
			resp.Write(GenerateAllMockDevices)
			Return
            
			' PATHWAY B: WRITE MODE (Fired when you hit your curl command line)
		Else If paramType = "udevice" Then
			Log($"   ⚡ [DATA LOGGED TO MEMORY] IDX: ${idxUpdate} | Value: ${sValueStr}"$)
            
			' Save the new value directly to the global process memory map
			Main.RuntimeDevices.Put(idxUpdate, sValueStr)
            
			' Return standard successful confirmation payload back to curl
			resp.Write("{""status"":""OK"",""title"":""UpdateDevice""}")
			Return
		End If
	End If
    
	resp.Write("{""status"" : ""ERR_UNSUPPORTED_COMMAND""}")
End Sub

' Generates your original multi-device list payload to fill your dashboard slots
Private Sub GenerateAllMockDevices As String
	Dim resultRoot As Map
	resultRoot.Initialize
	resultRoot.Put("status", "OK")
	resultRoot.Put("title", "GetDevices")
    
	Dim resultList As List
	resultList.Initialize
    
	' =========================================================================
	' DEVICE 1: SYSTEM BATTERY SOC (IDX 12)
	' =========================================================================
	Dim batteryMap As Map
	batteryMap.Initialize
	batteryMap.Put("idx", "12")
	batteryMap.Put("Name", "System Battery SOC")
	batteryMap.Put("Type", "Usage")
    
	' Check the storage map: If a curl write hit this index, use it! Otherwise use default.
	If Main.RuntimeDevices.ContainsKey("12") Then
		Dim liveBatteryVal As String = Main.RuntimeDevices.Get("12")
		batteryMap.Put("Data", liveBatteryVal)
		batteryMap.Put("Status", liveBatteryVal & " %")
	Else
		batteryMap.Put("Data", "100")
		batteryMap.Put("Status", "100 %")
	End If
	batteryMap.Put("LastUpdate", DateTime.Date(DateTime.Now) & " " & DateTime.Time(DateTime.Now))
	resultList.Add(batteryMap)
    
	' =========================================================================
	' DEVICE 2: SOLAR GENERATION (IDX 5)
	' =========================================================================
	Dim solarMap As Map
	solarMap.Initialize
	solarMap.Put("idx", "5")
	solarMap.Put("Name", "Solar Generation")
	solarMap.Put("Type", "Usage")
    
	If Main.RuntimeDevices.ContainsKey("5") Then
		Dim liveSolarVal As String = Main.RuntimeDevices.Get("5")
		solarMap.Put("Data", liveSolarVal)
		solarMap.Put("Status", liveSolarVal & " Watt")
	Else
		solarMap.Put("Data", "1252")
		solarMap.Put("Status", "1252 Watt")
	End If
	solarMap.Put("LastUpdate", DateTime.Date(DateTime.Now) & " " & DateTime.Time(DateTime.Now))
	resultList.Add(solarMap)

	resultRoot.Put("result", resultList)
    
	Dim jsonGen As JSONGenerator
	jsonGen.Initialize(resultRoot)
	Return jsonGen.ToString
End Sub
