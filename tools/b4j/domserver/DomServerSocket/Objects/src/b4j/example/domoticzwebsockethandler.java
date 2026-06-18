package b4j.example;


import anywheresoftware.b4a.BA;
import anywheresoftware.b4a.B4AClass;

public class domoticzwebsockethandler extends B4AClass.ImplB4AClass implements BA.SubDelegator{
    public static java.util.HashMap<String, java.lang.reflect.Method> htSubs;
    private void innerInitialize(BA _ba) throws Exception {
        if (ba == null) {
            ba = new  anywheresoftware.b4a.StandardBA("b4j.example", "b4j.example.domoticzwebsockethandler", this);
            if (htSubs == null) {
                ba.loadHtSubs(this.getClass());
                htSubs = ba.htSubs;
            }
            ba.htSubs = htSubs;
             
        }
        if (BA.isShellModeRuntimeCheck(ba))
                this.getClass().getMethod("_class_globals", b4j.example.domoticzwebsockethandler.class).invoke(this, new Object[] {null});
        else
            ba.raiseEvent2(null, true, "class_globals", false);
    }

 public anywheresoftware.b4a.keywords.Common __c = null;
public anywheresoftware.b4j.object.WebSocket _ws = null;
public b4j.example.main _main = null;
public String  _broadcastlivechange(String _idx,String _svalue) throws Exception{
anywheresoftware.b4a.objects.collections.Map _resultroot = null;
anywheresoftware.b4a.objects.collections.Map _devicemap = null;
anywheresoftware.b4j.objects.collections.JSONParser.JSONGenerator _jsongen = null;
 //BA.debugLineNum = 30;BA.debugLine="Public Sub BroadcastLiveChange(idx As String, sval";
 //BA.debugLineNum = 32;BA.debugLine="If ws = Null Or ws.Open = False Then Return";
if (_ws== null || _ws.getOpen()==__c.False) { 
if (true) return "";};
 //BA.debugLineNum = 34;BA.debugLine="Try";
try { //BA.debugLineNum = 36;BA.debugLine="Dim resultRoot As Map";
_resultroot = new anywheresoftware.b4a.objects.collections.Map();
 //BA.debugLineNum = 37;BA.debugLine="resultRoot.Initialize";
_resultroot.Initialize();
 //BA.debugLineNum = 38;BA.debugLine="resultRoot.Put(\"status\", \"OK\")";
_resultroot.Put((Object)("status"),(Object)("OK"));
 //BA.debugLineNum = 39;BA.debugLine="resultRoot.Put(\"event\", \"deviceUpdate\")";
_resultroot.Put((Object)("event"),(Object)("deviceUpdate"));
 //BA.debugLineNum = 41;BA.debugLine="Dim deviceMap As Map";
_devicemap = new anywheresoftware.b4a.objects.collections.Map();
 //BA.debugLineNum = 42;BA.debugLine="deviceMap.Initialize";
_devicemap.Initialize();
 //BA.debugLineNum = 43;BA.debugLine="deviceMap.Put(\"idx\", idx)";
_devicemap.Put((Object)("idx"),(Object)(_idx));
 //BA.debugLineNum = 44;BA.debugLine="deviceMap.Put(\"Name\", \"Live Simulation API Overr";
_devicemap.Put((Object)("Name"),(Object)("Live Simulation API Override"));
 //BA.debugLineNum = 47;BA.debugLine="If idx = \"12\" Then";
if ((_idx).equals("12")) { 
 //BA.debugLineNum = 48;BA.debugLine="deviceMap.Put(\"Type\", \"Usage\")";
_devicemap.Put((Object)("Type"),(Object)("Usage"));
 }else {
 //BA.debugLineNum = 50;BA.debugLine="deviceMap.Put(\"Type\", \"Alarm\")";
_devicemap.Put((Object)("Type"),(Object)("Alarm"));
 };
 //BA.debugLineNum = 53;BA.debugLine="deviceMap.Put(\"Data\", svalue)";
_devicemap.Put((Object)("Data"),(Object)(_svalue));
 //BA.debugLineNum = 54;BA.debugLine="deviceMap.Put(\"svalue\", svalue)";
_devicemap.Put((Object)("svalue"),(Object)(_svalue));
 //BA.debugLineNum = 55;BA.debugLine="deviceMap.Put(\"LastUpdate\", DateTime.Date(DateTi";
_devicemap.Put((Object)("LastUpdate"),(Object)(__c.DateTime.Date(__c.DateTime.getNow())+" "+__c.DateTime.Time(__c.DateTime.getNow())));
 //BA.debugLineNum = 57;BA.debugLine="resultRoot.Put(\"device\", deviceMap)";
_resultroot.Put((Object)("device"),(Object)(_devicemap.getObject()));
 //BA.debugLineNum = 59;BA.debugLine="Dim jsonGen As JSONGenerator";
_jsongen = new anywheresoftware.b4j.objects.collections.JSONParser.JSONGenerator();
 //BA.debugLineNum = 60;BA.debugLine="jsonGen.Initialize(resultRoot)";
_jsongen.Initialize(_resultroot);
 //BA.debugLineNum = 63;BA.debugLine="ws.RunFunction(\"onServerPush\", Array(jsonGen.ToS";
_ws.RunFunction("onServerPush",anywheresoftware.b4a.keywords.Common.ArrayToList(new Object[]{(Object)(_jsongen.ToString())}));
 //BA.debugLineNum = 64;BA.debugLine="ws.Flush ' Clear network buffers and enforce ins";
_ws.Flush();
 //BA.debugLineNum = 66;BA.debugLine="Log(\"⚡ [WEBSOCKET NOTIFICATION DISPATCHED] Pushe";
__c.LogImpl("7786468","⚡ [WEBSOCKET NOTIFICATION DISPATCHED] Pushed live update loop state via udevice for IDX: "+_idx,0);
 } 
       catch (Exception e26) {
			ba.setLastException(e26); //BA.debugLineNum = 68;BA.debugLine="Log(\"⚠️  [BROADCAST ERROR] WebSocket channel fai";
__c.LogImpl("7786470","⚠️  [BROADCAST ERROR] WebSocket channel failed to pipe live change event frame.",0);
 };
 //BA.debugLineNum = 70;BA.debugLine="End Sub";
return "";
}
public String  _class_globals() throws Exception{
 //BA.debugLineNum = 5;BA.debugLine="Sub Class_Globals";
 //BA.debugLineNum = 6;BA.debugLine="Private ws As WebSocket ' Native WebSocket connec";
_ws = new anywheresoftware.b4j.object.WebSocket();
 //BA.debugLineNum = 7;BA.debugLine="End Sub";
return "";
}
public String  _initialize(anywheresoftware.b4a.BA _ba) throws Exception{
innerInitialize(_ba);
 //BA.debugLineNum = 9;BA.debugLine="Public Sub Initialize";
 //BA.debugLineNum = 11;BA.debugLine="End Sub";
return "";
}
public String  _websocket_connected(anywheresoftware.b4j.object.WebSocket _websocket1) throws Exception{
 //BA.debugLineNum = 14;BA.debugLine="Private Sub WebSocket_Connected (WebSocket1 As Web";
 //BA.debugLineNum = 15;BA.debugLine="ws = WebSocket1";
_ws = _websocket1;
 //BA.debugLineNum = 16;BA.debugLine="Log(\"🟢 [WEBSOCKET CONNECTED] Dashboard client tu";
__c.LogImpl("7589826","🟢 [WEBSOCKET CONNECTED] Dashboard client tunnel open!",0);
 //BA.debugLineNum = 19;BA.debugLine="Main.CurrentUserSession = Me";
_main._currentusersession /*b4j.example.domoticzwebsockethandler*/  = (b4j.example.domoticzwebsockethandler)(this);
 //BA.debugLineNum = 20;BA.debugLine="End Sub";
return "";
}
public String  _websocket_disconnected() throws Exception{
 //BA.debugLineNum = 23;BA.debugLine="Private Sub WebSocket_Disconnected";
 //BA.debugLineNum = 24;BA.debugLine="Log(\"🔴 [WEBSOCKET DISCONNECTED] Client closed tu";
__c.LogImpl("7655361","🔴 [WEBSOCKET DISCONNECTED] Client closed tunnel path.",0);
 //BA.debugLineNum = 26;BA.debugLine="Main.CurrentUserSession = Null";
_main._currentusersession /*b4j.example.domoticzwebsockethandler*/  = (b4j.example.domoticzwebsockethandler)(__c.Null);
 //BA.debugLineNum = 27;BA.debugLine="End Sub";
return "";
}
public Object callSub(String sub, Object sender, Object[] args) throws Exception {
BA.senderHolder.set(sender);
return BA.SubDelegator.SubNotFound;
}
}
