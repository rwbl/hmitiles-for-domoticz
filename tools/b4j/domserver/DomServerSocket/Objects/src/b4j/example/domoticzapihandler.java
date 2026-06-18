package b4j.example;


import anywheresoftware.b4a.BA;
import anywheresoftware.b4a.B4AClass;

public class domoticzapihandler extends B4AClass.ImplB4AClass implements BA.SubDelegator{
    public static java.util.HashMap<String, java.lang.reflect.Method> htSubs;
    private void innerInitialize(BA _ba) throws Exception {
        if (ba == null) {
            ba = new  anywheresoftware.b4a.StandardBA("b4j.example", "b4j.example.domoticzapihandler", this);
            if (htSubs == null) {
                ba.loadHtSubs(this.getClass());
                htSubs = ba.htSubs;
            }
            ba.htSubs = htSubs;
             
        }
        if (BA.isShellModeRuntimeCheck(ba))
                this.getClass().getMethod("_class_globals", b4j.example.domoticzapihandler.class).invoke(this, new Object[] {null});
        else
            ba.raiseEvent2(null, true, "class_globals", false);
    }

 public anywheresoftware.b4a.keywords.Common __c = null;
public b4j.example.main _main = null;
public String  _class_globals() throws Exception{
 //BA.debugLineNum = 5;BA.debugLine="Sub Class_Globals";
 //BA.debugLineNum = 7;BA.debugLine="End Sub";
return "";
}
public String  _generateallmockdevices() throws Exception{
anywheresoftware.b4a.objects.collections.Map _resultroot = null;
anywheresoftware.b4a.objects.collections.List _resultlist = null;
anywheresoftware.b4a.objects.collections.Map _batterymap = null;
String _livebatteryval = "";
anywheresoftware.b4a.objects.collections.Map _solarmap = null;
String _livesolarval = "";
anywheresoftware.b4j.objects.collections.JSONParser.JSONGenerator _jsongen = null;
 //BA.debugLineNum = 55;BA.debugLine="Private Sub GenerateAllMockDevices As String";
 //BA.debugLineNum = 56;BA.debugLine="Dim resultRoot As Map";
_resultroot = new anywheresoftware.b4a.objects.collections.Map();
 //BA.debugLineNum = 57;BA.debugLine="resultRoot.Initialize";
_resultroot.Initialize();
 //BA.debugLineNum = 58;BA.debugLine="resultRoot.Put(\"status\", \"OK\")";
_resultroot.Put((Object)("status"),(Object)("OK"));
 //BA.debugLineNum = 59;BA.debugLine="resultRoot.Put(\"title\", \"GetDevices\")";
_resultroot.Put((Object)("title"),(Object)("GetDevices"));
 //BA.debugLineNum = 61;BA.debugLine="Dim resultList As List";
_resultlist = new anywheresoftware.b4a.objects.collections.List();
 //BA.debugLineNum = 62;BA.debugLine="resultList.Initialize";
_resultlist.Initialize();
 //BA.debugLineNum = 67;BA.debugLine="Dim batteryMap As Map";
_batterymap = new anywheresoftware.b4a.objects.collections.Map();
 //BA.debugLineNum = 68;BA.debugLine="batteryMap.Initialize";
_batterymap.Initialize();
 //BA.debugLineNum = 69;BA.debugLine="batteryMap.Put(\"idx\", \"12\")";
_batterymap.Put((Object)("idx"),(Object)("12"));
 //BA.debugLineNum = 70;BA.debugLine="batteryMap.Put(\"Name\", \"System Battery SOC\")";
_batterymap.Put((Object)("Name"),(Object)("System Battery SOC"));
 //BA.debugLineNum = 71;BA.debugLine="batteryMap.Put(\"Type\", \"Usage\")";
_batterymap.Put((Object)("Type"),(Object)("Usage"));
 //BA.debugLineNum = 74;BA.debugLine="If Main.RuntimeDevices.ContainsKey(\"12\") Then";
if (_main._runtimedevices /*anywheresoftware.b4a.objects.collections.Map*/ .ContainsKey((Object)("12"))) { 
 //BA.debugLineNum = 75;BA.debugLine="Dim liveBatteryVal As String = Main.RuntimeDevic";
_livebatteryval = BA.ObjectToString(_main._runtimedevices /*anywheresoftware.b4a.objects.collections.Map*/ .Get((Object)("12")));
 //BA.debugLineNum = 76;BA.debugLine="batteryMap.Put(\"Data\", liveBatteryVal)";
_batterymap.Put((Object)("Data"),(Object)(_livebatteryval));
 //BA.debugLineNum = 77;BA.debugLine="batteryMap.Put(\"Status\", liveBatteryVal & \" %\")";
_batterymap.Put((Object)("Status"),(Object)(_livebatteryval+" %"));
 }else {
 //BA.debugLineNum = 79;BA.debugLine="batteryMap.Put(\"Data\", \"100\")";
_batterymap.Put((Object)("Data"),(Object)("100"));
 //BA.debugLineNum = 80;BA.debugLine="batteryMap.Put(\"Status\", \"100 %\")";
_batterymap.Put((Object)("Status"),(Object)("100 %"));
 };
 //BA.debugLineNum = 82;BA.debugLine="batteryMap.Put(\"LastUpdate\", DateTime.Date(DateTi";
_batterymap.Put((Object)("LastUpdate"),(Object)(__c.DateTime.Date(__c.DateTime.getNow())+" "+__c.DateTime.Time(__c.DateTime.getNow())));
 //BA.debugLineNum = 83;BA.debugLine="resultList.Add(batteryMap)";
_resultlist.Add((Object)(_batterymap.getObject()));
 //BA.debugLineNum = 88;BA.debugLine="Dim solarMap As Map";
_solarmap = new anywheresoftware.b4a.objects.collections.Map();
 //BA.debugLineNum = 89;BA.debugLine="solarMap.Initialize";
_solarmap.Initialize();
 //BA.debugLineNum = 90;BA.debugLine="solarMap.Put(\"idx\", \"5\")";
_solarmap.Put((Object)("idx"),(Object)("5"));
 //BA.debugLineNum = 91;BA.debugLine="solarMap.Put(\"Name\", \"Solar Generation\")";
_solarmap.Put((Object)("Name"),(Object)("Solar Generation"));
 //BA.debugLineNum = 92;BA.debugLine="solarMap.Put(\"Type\", \"Usage\")";
_solarmap.Put((Object)("Type"),(Object)("Usage"));
 //BA.debugLineNum = 94;BA.debugLine="If Main.RuntimeDevices.ContainsKey(\"5\") Then";
if (_main._runtimedevices /*anywheresoftware.b4a.objects.collections.Map*/ .ContainsKey((Object)("5"))) { 
 //BA.debugLineNum = 95;BA.debugLine="Dim liveSolarVal As String = Main.RuntimeDevices";
_livesolarval = BA.ObjectToString(_main._runtimedevices /*anywheresoftware.b4a.objects.collections.Map*/ .Get((Object)("5")));
 //BA.debugLineNum = 96;BA.debugLine="solarMap.Put(\"Data\", liveSolarVal)";
_solarmap.Put((Object)("Data"),(Object)(_livesolarval));
 //BA.debugLineNum = 97;BA.debugLine="solarMap.Put(\"Status\", liveSolarVal & \" Watt\")";
_solarmap.Put((Object)("Status"),(Object)(_livesolarval+" Watt"));
 }else {
 //BA.debugLineNum = 99;BA.debugLine="solarMap.Put(\"Data\", \"1252\")";
_solarmap.Put((Object)("Data"),(Object)("1252"));
 //BA.debugLineNum = 100;BA.debugLine="solarMap.Put(\"Status\", \"1252 Watt\")";
_solarmap.Put((Object)("Status"),(Object)("1252 Watt"));
 };
 //BA.debugLineNum = 102;BA.debugLine="solarMap.Put(\"LastUpdate\", DateTime.Date(DateTime";
_solarmap.Put((Object)("LastUpdate"),(Object)(__c.DateTime.Date(__c.DateTime.getNow())+" "+__c.DateTime.Time(__c.DateTime.getNow())));
 //BA.debugLineNum = 103;BA.debugLine="resultList.Add(solarMap)";
_resultlist.Add((Object)(_solarmap.getObject()));
 //BA.debugLineNum = 105;BA.debugLine="resultRoot.Put(\"result\", resultList)";
_resultroot.Put((Object)("result"),(Object)(_resultlist.getObject()));
 //BA.debugLineNum = 107;BA.debugLine="Dim jsonGen As JSONGenerator";
_jsongen = new anywheresoftware.b4j.objects.collections.JSONParser.JSONGenerator();
 //BA.debugLineNum = 108;BA.debugLine="jsonGen.Initialize(resultRoot)";
_jsongen.Initialize(_resultroot);
 //BA.debugLineNum = 109;BA.debugLine="Return jsonGen.ToString";
if (true) return _jsongen.ToString();
 //BA.debugLineNum = 110;BA.debugLine="End Sub";
return "";
}
public String  _handle(anywheresoftware.b4j.object.JServlet.ServletRequestWrapper _req,anywheresoftware.b4j.object.JServlet.ServletResponseWrapper _resp) throws Exception{
String _commandtype = "";
String _paramtype = "";
String _ridstring = "";
String _filtertype = "";
String _idxupdate = "";
String _svaluestr = "";
 //BA.debugLineNum = 13;BA.debugLine="Sub Handle(req As ServletRequest, resp As ServletR";
 //BA.debugLineNum = 15;BA.debugLine="resp.SetHeader(\"Access-Control-Allow-Origin\", \"*\"";
_resp.SetHeader("Access-Control-Allow-Origin","*");
 //BA.debugLineNum = 16;BA.debugLine="resp.SetHeader(\"Access-Control-Allow-Methods\", \"G";
_resp.SetHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS");
 //BA.debugLineNum = 17;BA.debugLine="resp.ContentType = \"application/json;charset=UTF-";
_resp.setContentType("application/json;charset=UTF-8");
 //BA.debugLineNum = 20;BA.debugLine="Dim commandType As String = req.GetParameter(\"typ";
_commandtype = _req.GetParameter("type");
 //BA.debugLineNum = 21;BA.debugLine="Dim paramType   As String = req.GetParameter(\"par";
_paramtype = _req.GetParameter("param");
 //BA.debugLineNum = 22;BA.debugLine="Dim ridString   As String = req.GetParameter(\"rid";
_ridstring = _req.GetParameter("rid");
 //BA.debugLineNum = 23;BA.debugLine="Dim filterType  As String = req.GetParameter(\"fil";
_filtertype = _req.GetParameter("filter");
 //BA.debugLineNum = 25;BA.debugLine="Dim idxUpdate   As String = req.GetParameter(\"idx";
_idxupdate = _req.GetParameter("idx");
 //BA.debugLineNum = 26;BA.debugLine="Dim sValueStr   As String = req.GetParameter(\"sva";
_svaluestr = _req.GetParameter("svalue");
 //BA.debugLineNum = 28;BA.debugLine="Log($\"[HTTP REQUEST EVENT] type=${commandType}, p";
__c.LogImpl("7262159",("[HTTP REQUEST EVENT] type="+__c.SmartStringFormatter("",(Object)(_commandtype))+", param="+__c.SmartStringFormatter("",(Object)(_paramtype))+""),0);
 //BA.debugLineNum = 31;BA.debugLine="If commandType = \"command\" Then";
if ((_commandtype).equals("command")) { 
 //BA.debugLineNum = 34;BA.debugLine="If paramType = \"getdevices\" And filterType = \"al";
if ((_paramtype).equals("getdevices") && (_filtertype).equals("all")) { 
 //BA.debugLineNum = 35;BA.debugLine="resp.Write(GenerateAllMockDevices)";
_resp.Write(_generateallmockdevices());
 //BA.debugLineNum = 36;BA.debugLine="Return";
if (true) return "";
 }else if((_paramtype).equals("udevice")) { 
 //BA.debugLineNum = 40;BA.debugLine="Log($\"   ⚡ [DATA LOGGED TO MEMORY] IDX: ${idxUp";
__c.LogImpl("7262171",("   ⚡ [DATA LOGGED TO MEMORY] IDX: "+__c.SmartStringFormatter("",(Object)(_idxupdate))+" | Value: "+__c.SmartStringFormatter("",(Object)(_svaluestr))+""),0);
 //BA.debugLineNum = 43;BA.debugLine="Main.RuntimeDevices.Put(idxUpdate, sValueStr)";
_main._runtimedevices /*anywheresoftware.b4a.objects.collections.Map*/ .Put((Object)(_idxupdate),(Object)(_svaluestr));
 //BA.debugLineNum = 46;BA.debugLine="resp.Write(\"{\"\"status\"\":\"\"OK\"\",\"\"title\"\":\"\"Upda";
_resp.Write("{\"status\":\"OK\",\"title\":\"UpdateDevice\"}");
 //BA.debugLineNum = 47;BA.debugLine="Return";
if (true) return "";
 };
 };
 //BA.debugLineNum = 51;BA.debugLine="resp.Write(\"{\"\"status\"\" : \"\"ERR_UNSUPPORTED_COMMA";
_resp.Write("{\"status\" : \"ERR_UNSUPPORTED_COMMAND\"}");
 //BA.debugLineNum = 52;BA.debugLine="End Sub";
return "";
}
public String  _initialize(anywheresoftware.b4a.BA _ba) throws Exception{
innerInitialize(_ba);
 //BA.debugLineNum = 9;BA.debugLine="Public Sub Initialize";
 //BA.debugLineNum = 11;BA.debugLine="End Sub";
return "";
}
public Object callSub(String sub, Object sender, Object[] args) throws Exception {
BA.senderHolder.set(sender);
return BA.SubDelegator.SubNotFound;
}
}
