package b4j.example;


import anywheresoftware.b4a.BA;

public class main extends Object{
public static main mostCurrent = new main();

public static BA ba;
static {
		ba = new  anywheresoftware.b4a.StandardBA("b4j.example", "b4j.example.main", null);
		ba.loadHtSubs(main.class);
        if (ba.getClass().getName().endsWith("ShellBA")) {
			
			ba.raiseEvent2(null, true, "SHELL", false);
			ba.raiseEvent2(null, true, "CREATE", true, "b4j.example.main", ba);
		}
	}
    public static Class<?> getObject() {
		return main.class;
	}

 
    public static void main(String[] args) throws Exception{
        try {
            anywheresoftware.b4a.keywords.Common.LogDebug("Program started.");
            initializeProcessGlobals();
            ba.raiseEvent(null, "appstart", (Object)args);
        } catch (Throwable t) {
			BA.printException(t, true);
		
        } finally {
            anywheresoftware.b4a.keywords.Common.LogDebug("Program terminated (StartMessageLoop was not called).");
        }
    }
public static anywheresoftware.b4a.keywords.Common __c = null;
public static anywheresoftware.b4j.object.ServerWrapper _srvr = null;
public static int _server_port = 0;
public static String  _appstart(String[] _args) throws Exception{
 //BA.debugLineNum = 43;BA.debugLine="Sub AppStart (Args() As String)";
 //BA.debugLineNum = 44;BA.debugLine="Log(\"============================================";
anywheresoftware.b4a.keywords.Common.LogImpl("365537","=========================================================================",0);
 //BA.debugLineNum = 45;BA.debugLine="Log(\" Starting Multi-Directional Domoticz Simulat";
anywheresoftware.b4a.keywords.Common.LogImpl("365538"," Starting Multi-Directional Domoticz Simulator Server Backend...       ",0);
 //BA.debugLineNum = 46;BA.debugLine="Log(\"============================================";
anywheresoftware.b4a.keywords.Common.LogImpl("365539","=========================================================================",0);
 //BA.debugLineNum = 49;BA.debugLine="srvr.Initialize(\"srvr\")";
_srvr.Initialize(ba,"srvr");
 //BA.debugLineNum = 52;BA.debugLine="srvr.Port = SERVER_PORT";
_srvr.setPort(_server_port);
 //BA.debugLineNum = 59;BA.debugLine="srvr.AddHandler(\"/json.htm\", \"DomoticzAPIHandler\"";
_srvr.AddHandler("/json.htm","DomoticzAPIHandler",anywheresoftware.b4a.keywords.Common.False);
 //BA.debugLineNum = 64;BA.debugLine="srvr.Start";
_srvr.Start();
 //BA.debugLineNum = 66;BA.debugLine="Log($\"🚀 Local Simulator Booted Successfully!\"$)";
anywheresoftware.b4a.keywords.Common.LogImpl("365559",("🚀 Local Simulator Booted Successfully!"),0);
 //BA.debugLineNum = 67;BA.debugLine="Log($\"   Listening live on target entry socket li";
anywheresoftware.b4a.keywords.Common.LogImpl("365560",("   Listening live on target entry socket link: http://127.0.0.1:"+anywheresoftware.b4a.keywords.Common.SmartStringFormatter("",(Object)(_server_port))+"/"),0);
 //BA.debugLineNum = 68;BA.debugLine="Log(\"👉 Move your dashboard files (index.html, JS";
anywheresoftware.b4a.keywords.Common.LogImpl("365561","👉 Move your dashboard files (index.html, JS, CSS) to the Objects/www/ folder to host them concurrently.",0);
 //BA.debugLineNum = 69;BA.debugLine="Log(\"⌨️  Press Ctrl+C inside this terminal consol";
anywheresoftware.b4a.keywords.Common.LogImpl("365562","⌨️  Press Ctrl+C inside this terminal console host window environment to stop the service loop safely.",0);
 //BA.debugLineNum = 74;BA.debugLine="StartMessageLoop";
anywheresoftware.b4a.keywords.Common.StartMessageLoop(ba);
 //BA.debugLineNum = 75;BA.debugLine="End Sub";
return "";
}

private static boolean processGlobalsRun;
public static void initializeProcessGlobals() {
    
    if (main.processGlobalsRun == false) {
	    main.processGlobalsRun = true;
		try {
		        main._process_globals();
		
        } catch (Exception e) {
			throw new RuntimeException(e);
		}
    }
}public static String  _process_globals() throws Exception{
 //BA.debugLineNum = 35;BA.debugLine="Sub Process_Globals";
 //BA.debugLineNum = 39;BA.debugLine="Private srvr As Server              ' The master";
_srvr = new anywheresoftware.b4j.object.ServerWrapper();
 //BA.debugLineNum = 40;BA.debugLine="Private const SERVER_PORT As Int = 8080 ' Standar";
_server_port = (int) (8080);
 //BA.debugLineNum = 41;BA.debugLine="End Sub";
return "";
}
}
