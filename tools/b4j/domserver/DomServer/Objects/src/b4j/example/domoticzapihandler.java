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
 //BA.debugLineNum = 8;BA.debugLine="End Sub";
return "";
}
public String  _generateallmockdevices() throws Exception{
anywheresoftware.b4a.objects.collections.Map _resultroot = null;
anywheresoftware.b4a.objects.collections.List _resultlist = null;
anywheresoftware.b4a.objects.collections.Map _solarmap = null;
anywheresoftware.b4a.objects.collections.Map _batterymap = null;
anywheresoftware.b4a.objects.collections.Map _airmap = null;
anywheresoftware.b4a.objects.collections.Map _windmap = null;
anywheresoftware.b4j.objects.collections.JSONParser.JSONGenerator _jsongen = null;
 //BA.debugLineNum = 80;BA.debugLine="Private Sub GenerateAllMockDevices As String";
 //BA.debugLineNum = 82;BA.debugLine="Dim resultRoot As Map";
_resultroot = new anywheresoftware.b4a.objects.collections.Map();
 //BA.debugLineNum = 83;BA.debugLine="resultRoot.Initialize";
_resultroot.Initialize();
 //BA.debugLineNum = 84;BA.debugLine="resultRoot.Put(\"status\", \"OK\")";
_resultroot.Put((Object)("status"),(Object)("OK"));
 //BA.debugLineNum = 85;BA.debugLine="resultRoot.Put(\"title\", \"GetDevices\")";
_resultroot.Put((Object)("title"),(Object)("GetDevices"));
 //BA.debugLineNum = 88;BA.debugLine="Dim resultList As List";
_resultlist = new anywheresoftware.b4a.objects.collections.List();
 //BA.debugLineNum = 89;BA.debugLine="resultList.Initialize";
_resultlist.Initialize();
 //BA.debugLineNum = 94;BA.debugLine="Dim solarMap As Map";
_solarmap = new anywheresoftware.b4a.objects.collections.Map();
 //BA.debugLineNum = 95;BA.debugLine="solarMap.Initialize";
_solarmap.Initialize();
 //BA.debugLineNum = 96;BA.debugLine="solarMap.Put(\"idx\", \"5\")";
_solarmap.Put((Object)("idx"),(Object)("5"));
 //BA.debugLineNum = 97;BA.debugLine="solarMap.Put(\"Name\", \"Solar Generation\")";
_solarmap.Put((Object)("Name"),(Object)("Solar Generation"));
 //BA.debugLineNum = 98;BA.debugLine="solarMap.Put(\"Type\", \"Usage\")";
_solarmap.Put((Object)("Type"),(Object)("Usage"));
 //BA.debugLineNum = 99;BA.debugLine="solarMap.Put(\"Data\", \"1252\")";
_solarmap.Put((Object)("Data"),(Object)("1252"));
 //BA.debugLineNum = 100;BA.debugLine="solarMap.Put(\"Status\", \"1252 Watt\")";
_solarmap.Put((Object)("Status"),(Object)("1252 Watt"));
 //BA.debugLineNum = 101;BA.debugLine="solarMap.Put(\"LastUpdate\", \"2026-06-16 11:30:00\")";
_solarmap.Put((Object)("LastUpdate"),(Object)("2026-06-16 11:30:00"));
 //BA.debugLineNum = 102;BA.debugLine="resultList.Add(solarMap)";
_resultlist.Add((Object)(_solarmap.getObject()));
 //BA.debugLineNum = 107;BA.debugLine="Dim batteryMap As Map";
_batterymap = new anywheresoftware.b4a.objects.collections.Map();
 //BA.debugLineNum = 108;BA.debugLine="batteryMap.Initialize";
_batterymap.Initialize();
 //BA.debugLineNum = 109;BA.debugLine="batteryMap.Put(\"idx\", \"12\")";
_batterymap.Put((Object)("idx"),(Object)("12"));
 //BA.debugLineNum = 110;BA.debugLine="batteryMap.Put(\"Name\", \"System Battery SOC\")";
_batterymap.Put((Object)("Name"),(Object)("System Battery SOC"));
 //BA.debugLineNum = 111;BA.debugLine="batteryMap.Put(\"Type\", \"Usage\")";
_batterymap.Put((Object)("Type"),(Object)("Usage"));
 //BA.debugLineNum = 112;BA.debugLine="batteryMap.Put(\"Data\", \"100\")";
_batterymap.Put((Object)("Data"),(Object)("100"));
 //BA.debugLineNum = 113;BA.debugLine="batteryMap.Put(\"Status\", \"100 %\")";
_batterymap.Put((Object)("Status"),(Object)("100 %"));
 //BA.debugLineNum = 114;BA.debugLine="batteryMap.Put(\"LastUpdate\", \"2026-06-16 11:30:00";
_batterymap.Put((Object)("LastUpdate"),(Object)("2026-06-16 11:30:00"));
 //BA.debugLineNum = 115;BA.debugLine="resultList.Add(batteryMap)";
_resultlist.Add((Object)(_batterymap.getObject()));
 //BA.debugLineNum = 120;BA.debugLine="Dim airMap As Map";
_airmap = new anywheresoftware.b4a.objects.collections.Map();
 //BA.debugLineNum = 121;BA.debugLine="airMap.Initialize";
_airmap.Initialize();
 //BA.debugLineNum = 122;BA.debugLine="airMap.Put(\"idx\", \"31\")";
_airmap.Put((Object)("idx"),(Object)("31"));
 //BA.debugLineNum = 123;BA.debugLine="airMap.Put(\"Name\", \"Air Quality Monitor\")";
_airmap.Put((Object)("Name"),(Object)("Air Quality Monitor"));
 //BA.debugLineNum = 124;BA.debugLine="airMap.Put(\"Type\", \"Air Quality\")";
_airmap.Put((Object)("Type"),(Object)("Air Quality"));
 //BA.debugLineNum = 125;BA.debugLine="airMap.Put(\"Data\", \"1200\")                    ' 1";
_airmap.Put((Object)("Data"),(Object)("1200"));
 //BA.debugLineNum = 126;BA.debugLine="airMap.Put(\"Status\", \"1200 PPM\")";
_airmap.Put((Object)("Status"),(Object)("1200 PPM"));
 //BA.debugLineNum = 127;BA.debugLine="airMap.Put(\"LastUpdate\", \"2026-06-16 11:30:00\")";
_airmap.Put((Object)("LastUpdate"),(Object)("2026-06-16 11:30:00"));
 //BA.debugLineNum = 128;BA.debugLine="resultList.Add(airMap)";
_resultlist.Add((Object)(_airmap.getObject()));
 //BA.debugLineNum = 133;BA.debugLine="Dim windMap As Map";
_windmap = new anywheresoftware.b4a.objects.collections.Map();
 //BA.debugLineNum = 134;BA.debugLine="windMap.Initialize";
_windmap.Initialize();
 //BA.debugLineNum = 135;BA.debugLine="windMap.Put(\"idx\", \"45\")";
_windmap.Put((Object)("idx"),(Object)("45"));
 //BA.debugLineNum = 136;BA.debugLine="windMap.Put(\"Name\", \"Weather Station Wind\")";
_windmap.Put((Object)("Name"),(Object)("Weather Station Wind"));
 //BA.debugLineNum = 137;BA.debugLine="windMap.Put(\"Type\", \"Wind\")";
_windmap.Put((Object)("Type"),(Object)("Wind"));
 //BA.debugLineNum = 139;BA.debugLine="windMap.Put(\"Data\", \"180;S;100;150;180;210\")   '";
_windmap.Put((Object)("Data"),(Object)("180;S;100;150;180;210"));
 //BA.debugLineNum = 140;BA.debugLine="windMap.Put(\"svalue\", \"180;S;100;150;180;210\")";
_windmap.Put((Object)("svalue"),(Object)("180;S;100;150;180;210"));
 //BA.debugLineNum = 141;BA.debugLine="windMap.Put(\"LastUpdate\", \"2026-06-16 11:30:00\")";
_windmap.Put((Object)("LastUpdate"),(Object)("2026-06-16 11:30:00"));
 //BA.debugLineNum = 142;BA.debugLine="resultList.Add(windMap)";
_resultlist.Add((Object)(_windmap.getObject()));
 //BA.debugLineNum = 145;BA.debugLine="resultRoot.Put(\"result\", resultList)";
_resultroot.Put((Object)("result"),(Object)(_resultlist.getObject()));
 //BA.debugLineNum = 152;BA.debugLine="Dim jsonGen As JSONGenerator";
_jsongen = new anywheresoftware.b4j.objects.collections.JSONParser.JSONGenerator();
 //BA.debugLineNum = 153;BA.debugLine="jsonGen.Initialize(resultRoot)";
_jsongen.Initialize(_resultroot);
 //BA.debugLineNum = 154;BA.debugLine="Return jsonGen.ToString";
if (true) return _jsongen.ToString();
 //BA.debugLineNum = 155;BA.debugLine="End Sub";
return "";
}
public String  _generatesingledevicedata(String _idx) throws Exception{
anywheresoftware.b4a.objects.collections.Map _resultroot = null;
anywheresoftware.b4a.objects.collections.List _resultlist = null;
anywheresoftware.b4a.objects.collections.Map _devicemap = null;
anywheresoftware.b4j.objects.collections.JSONParser.JSONGenerator _jsongen = null;
 //BA.debugLineNum = 160;BA.debugLine="Private Sub GenerateSingleDeviceData(idx As String";
 //BA.debugLineNum = 161;BA.debugLine="Dim resultRoot As Map";
_resultroot = new anywheresoftware.b4a.objects.collections.Map();
 //BA.debugLineNum = 162;BA.debugLine="resultRoot.Initialize";
_resultroot.Initialize();
 //BA.debugLineNum = 163;BA.debugLine="resultRoot.Put(\"status\", \"OK\")";
_resultroot.Put((Object)("status"),(Object)("OK"));
 //BA.debugLineNum = 164;BA.debugLine="resultRoot.Put(\"title\", \"GetDevices\")";
_resultroot.Put((Object)("title"),(Object)("GetDevices"));
 //BA.debugLineNum = 166;BA.debugLine="Dim resultList As List";
_resultlist = new anywheresoftware.b4a.objects.collections.List();
 //BA.debugLineNum = 167;BA.debugLine="resultList.Initialize";
_resultlist.Initialize();
 //BA.debugLineNum = 169;BA.debugLine="Dim deviceMap As Map";
_devicemap = new anywheresoftware.b4a.objects.collections.Map();
 //BA.debugLineNum = 170;BA.debugLine="deviceMap.Initialize";
_devicemap.Initialize();
 //BA.debugLineNum = 171;BA.debugLine="deviceMap.Put(\"idx\", idx)";
_devicemap.Put((Object)("idx"),(Object)(_idx));
 //BA.debugLineNum = 172;BA.debugLine="deviceMap.Put(\"LastUpdate\", \"2026-06-16 11:30:00\"";
_devicemap.Put((Object)("LastUpdate"),(Object)("2026-06-16 11:30:00"));
 //BA.debugLineNum = 175;BA.debugLine="Select Case idx";
switch (BA.switchObjectToInt(_idx,"5","12","31")) {
case 0: {
 //BA.debugLineNum = 177;BA.debugLine="deviceMap.Put(\"Name\", \"Solar Generation\")";
_devicemap.Put((Object)("Name"),(Object)("Solar Generation"));
 //BA.debugLineNum = 178;BA.debugLine="deviceMap.Put(\"Type\", \"Usage\")";
_devicemap.Put((Object)("Type"),(Object)("Usage"));
 //BA.debugLineNum = 179;BA.debugLine="deviceMap.Put(\"Data\", \"1252\")";
_devicemap.Put((Object)("Data"),(Object)("1252"));
 //BA.debugLineNum = 180;BA.debugLine="deviceMap.Put(\"Status\", \"1252 Watt\")";
_devicemap.Put((Object)("Status"),(Object)("1252 Watt"));
 break; }
case 1: {
 //BA.debugLineNum = 182;BA.debugLine="deviceMap.Put(\"Name\", \"System Battery SOC\")";
_devicemap.Put((Object)("Name"),(Object)("System Battery SOC"));
 //BA.debugLineNum = 183;BA.debugLine="deviceMap.Put(\"Type\", \"Usage\")";
_devicemap.Put((Object)("Type"),(Object)("Usage"));
 //BA.debugLineNum = 184;BA.debugLine="deviceMap.Put(\"Data\", \"100\")";
_devicemap.Put((Object)("Data"),(Object)("100"));
 //BA.debugLineNum = 185;BA.debugLine="deviceMap.Put(\"Status\", \"100 %\")";
_devicemap.Put((Object)("Status"),(Object)("100 %"));
 break; }
case 2: {
 //BA.debugLineNum = 187;BA.debugLine="deviceMap.Put(\"Name\", \"Air Quality Monitor\")";
_devicemap.Put((Object)("Name"),(Object)("Air Quality Monitor"));
 //BA.debugLineNum = 188;BA.debugLine="deviceMap.Put(\"Type\", \"Air Quality\")";
_devicemap.Put((Object)("Type"),(Object)("Air Quality"));
 //BA.debugLineNum = 189;BA.debugLine="deviceMap.Put(\"Data\", \"1200\")";
_devicemap.Put((Object)("Data"),(Object)("1200"));
 //BA.debugLineNum = 190;BA.debugLine="deviceMap.Put(\"Status\", \"1200 PPM\")";
_devicemap.Put((Object)("Status"),(Object)("1200 PPM"));
 break; }
default: {
 //BA.debugLineNum = 192;BA.debugLine="deviceMap.Put(\"Name\", \"Generic Secondary Node\")";
_devicemap.Put((Object)("Name"),(Object)("Generic Secondary Node"));
 //BA.debugLineNum = 193;BA.debugLine="deviceMap.Put(\"Type\", \"General\")";
_devicemap.Put((Object)("Type"),(Object)("General"));
 //BA.debugLineNum = 194;BA.debugLine="deviceMap.Put(\"Data\", \"0\")";
_devicemap.Put((Object)("Data"),(Object)("0"));
 //BA.debugLineNum = 195;BA.debugLine="deviceMap.Put(\"Status\", \"OK\")";
_devicemap.Put((Object)("Status"),(Object)("OK"));
 break; }
}
;
 //BA.debugLineNum = 198;BA.debugLine="resultList.Add(deviceMap)";
_resultlist.Add((Object)(_devicemap.getObject()));
 //BA.debugLineNum = 199;BA.debugLine="resultRoot.Put(\"result\", resultList)";
_resultroot.Put((Object)("result"),(Object)(_resultlist.getObject()));
 //BA.debugLineNum = 201;BA.debugLine="Dim jsonGen As JSONGenerator";
_jsongen = new anywheresoftware.b4j.objects.collections.JSONParser.JSONGenerator();
 //BA.debugLineNum = 202;BA.debugLine="jsonGen.Initialize(resultRoot)";
_jsongen.Initialize(_resultroot);
 //BA.debugLineNum = 203;BA.debugLine="Return jsonGen.ToString";
if (true) return _jsongen.ToString();
 //BA.debugLineNum = 204;BA.debugLine="End Sub";
return "";
}
public String  _handle(anywheresoftware.b4j.object.JServlet.ServletRequestWrapper _req,anywheresoftware.b4j.object.JServlet.ServletResponseWrapper _resp) throws Exception{
String _commandtype = "";
String _paramtype = "";
String _ridstring = "";
String _filtertype = "";
String _jsonresponse = "";
 //BA.debugLineNum = 21;BA.debugLine="Sub Handle(req As ServletRequest, resp As ServletR";
 //BA.debugLineNum = 29;BA.debugLine="resp.SetHeader(\"Access-Control-Allow-Origin\", \"*\"";
_resp.SetHeader("Access-Control-Allow-Origin","*");
 //BA.debugLineNum = 30;BA.debugLine="resp.SetHeader(\"Access-Control-Allow-Methods\", \"G";
_resp.SetHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS");
 //BA.debugLineNum = 35;BA.debugLine="resp.ContentType = \"application/json;charset=UTF-";
_resp.setContentType("application/json;charset=UTF-8");
 //BA.debugLineNum = 41;BA.debugLine="Dim commandType As String = req.GetParameter(\"typ";
_commandtype = _req.GetParameter("type");
 //BA.debugLineNum = 42;BA.debugLine="Dim paramType   As String = req.GetParameter(\"par";
_paramtype = _req.GetParameter("param");
 //BA.debugLineNum = 43;BA.debugLine="Dim ridString   As String = req.GetParameter(\"rid";
_ridstring = _req.GetParameter("rid");
 //BA.debugLineNum = 44;BA.debugLine="Dim filterType  As String = req.GetParameter(\"fil";
_filtertype = _req.GetParameter("filter");
 //BA.debugLineNum = 47;BA.debugLine="Log($\"[INCOMING REQUEST EVENT] type=${commandType";
__c.LogImpl("31179674",("[INCOMING REQUEST EVENT] type="+__c.SmartStringFormatter("",(Object)(_commandtype))+", param="+__c.SmartStringFormatter("",(Object)(_paramtype))+", rid="+__c.SmartStringFormatter("",(Object)(_ridstring))+", filter="+__c.SmartStringFormatter("",(Object)(_filtertype))+""),0);
 //BA.debugLineNum = 53;BA.debugLine="If commandType = \"command\" And paramType = \"getde";
if ((_commandtype).equals("command") && (_paramtype).equals("getdevices")) { 
 //BA.debugLineNum = 55;BA.debugLine="Dim jsonResponse As String = \"\"";
_jsonresponse = "";
 //BA.debugLineNum = 58;BA.debugLine="If filterType = \"all\" Then";
if ((_filtertype).equals("all")) { 
 //BA.debugLineNum = 60;BA.debugLine="jsonResponse = GenerateAllMockDevices";
_jsonresponse = _generateallmockdevices();
 }else {
 //BA.debugLineNum = 63;BA.debugLine="jsonResponse = GenerateSingleDeviceData(ridStri";
_jsonresponse = _generatesingledevicedata(_ridstring);
 };
 //BA.debugLineNum = 67;BA.debugLine="resp.Write(jsonResponse)";
_resp.Write(_jsonresponse);
 }else {
 //BA.debugLineNum = 71;BA.debugLine="Log(\"⚠️  Warning: Received an unmapped or invali";
__c.LogImpl("31179698","⚠️  Warning: Received an unmapped or invalid api request route string signature profile.",0);
 //BA.debugLineNum = 72;BA.debugLine="resp.Write(\"{\"\"status\"\" : \"\"ERR_UNSUPPORTED_COMM";
_resp.Write("{\"status\" : \"ERR_UNSUPPORTED_COMMAND\", \"message\":\"The simulator handles type=command&param=getdevices\"}");
 };
 //BA.debugLineNum = 74;BA.debugLine="End Sub";
return "";
}
public String  _initialize(anywheresoftware.b4a.BA _ba) throws Exception{
innerInitialize(_ba);
 //BA.debugLineNum = 11;BA.debugLine="Public Sub Initialize";
 //BA.debugLineNum = 13;BA.debugLine="End Sub";
return "";
}
public Object callSub(String sub, Object sender, Object[] args) throws Exception {
BA.senderHolder.set(sender);
return BA.SubDelegator.SubNotFound;
}
}
