B4J=true
Group=Default Group
ModulesStructureVersion=1
Type=Class
Version=10.5
@EndOfDesignText@
' Class Module: DomoticzWebSocketHandler
' Brief: Manages full-duplex socket tunnels, registers sessions, and dispatches 
'        instantaneous JSON push updates straight to your browser window.

Sub Class_Globals
	Private ws As WebSocket ' Native WebSocket connection tracking channel container
End Sub

Public Sub Initialize
	' Initialization logic
End Sub

' Triggered automatically by Jetty when a dashboard client opens a network socket link
Private Sub WebSocket_Connected (WebSocket1 As WebSocket)
	ws = WebSocket1
	Log("🟢 [WEBSOCKET CONNECTED] Dashboard client tunnel open!")
    
	' Save this live instance pointer directly to the global Main thread loop
	Main.CurrentUserSession = Me
End Sub

' Triggered automatically when the user closes the dashboard browser window
Private Sub WebSocket_Disconnected
	Log("🔴 [WEBSOCKET DISCONNECTED] Client closed tunnel path.")
	' Clean up the global process memory pointer safely to avoid errors
	Main.CurrentUserSession = Null
End Sub

' Public broadcast transformer called by the HTTP class whenever a udevice write fires
Public Sub BroadcastLiveChange(idx As String, svalue As String)
	' Safety boundary check: Exit instantly if the channel dropped out
	If ws = Null Or ws.Open = False Then Return

	Try
		' Compile a live frame payload matching your dashboard receiver expectations
		Dim resultRoot As Map
		resultRoot.Initialize
		resultRoot.Put("status", "OK")
		resultRoot.Put("event", "deviceUpdate")
        
		Dim deviceMap As Map
		deviceMap.Initialize
		deviceMap.Put("idx", idx)
		deviceMap.Put("Name", "Live Simulation API Override")
        
		' Map native types to match your Javascript query filters
		If idx = "12" Then
			deviceMap.Put("Type", "Usage")
		Else
			deviceMap.Put("Type", "Alarm")
		End If
        
		deviceMap.Put("Data", svalue)
		deviceMap.Put("svalue", svalue)
		deviceMap.Put("LastUpdate", DateTime.Date(DateTime.Now) & " " & DateTime.Time(DateTime.Now))
        
		resultRoot.Put("device", deviceMap)
        
		Dim jsonGen As JSONGenerator
		jsonGen.Initialize(resultRoot)
        
		' Execute immediate client-side function call over the socket tunnel line
		ws.RunFunction("onServerPush", Array(jsonGen.ToString))
		ws.Flush ' Clear network buffers and enforce instantaneous push transmission
        
		Log("⚡ [WEBSOCKET NOTIFICATION DISPATCHED] Pushed live update loop state via udevice for IDX: " & idx)
	Catch
		Log("⚠️  [BROADCAST ERROR] WebSocket channel failed to pipe live change event frame.")
	End Try
End Sub
