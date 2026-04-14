var flowView, recordView, chDialog, sensorsDb, codeEditor, PropGrid;
$(document).ready(function()
{
    console.log("Doc ready!!!");
    var asInitVals = new Array();
    // Alarms table
    $('#mainTabs').tabs({fit:true});
    var myTable = $('#alarmTbl').DataTable( {
        "oLanguage": {
            "sSearch": "Search all columns:"
        },
        "aaSorting": [[ 0, "desc" ]], // Start sorting by alarm ID, descending
        //"bAutoWidth": false, // Do not strech width to 100%
        "scrollY": "200",
        "scrollCollapse": "true",
        //"bJQueryUI": true,
        "sPaginationType": "simple_numbers",
        "sDom": '<t<"alarm_page"l><"alarm_info"i>p>',
        "fnCreatedRow": function( nRow, aData, iDataIndex ) {
            // Bold the grade for all 'A' grade browsers
            var cls;
            //p.panel('options').collapsed
            var alarmsCollapsed = $("#panels").layout('panel','south').panel('options').collapsed;
            var who;
            if (aData[2] == "Notification") {cls = "alarmGreen"; who = "pendingNotification"; }
            else if (aData[2] == "Warning") {cls = "alarmYellow"; who = "pendingWarning"; }
            else { cls = "alarmRed"; who = "pendingCritical"; }
            // Paint the cell
            $('td', nRow).addClass(cls);
            // Add pending
            if (alarmsCollapsed)
            {
                var el = parseInt($('#'+who).text());
                $('#'+who).text(el+1);
            }
        }
    });
    myTable.columns().every( function () {
        var that = this;
        $('input', this.footer()).on( 'keyup change clear', function () { 
            var index = 0;
            switch (this.name)
            {
                case "search_aid": index = 0; break;
                case "search_name": index = 1; break;
                case "search_ip": index = 2; break;
                case "search_severity": index = 3; break;
                case "search_type": index = 4; break;
                case "search_sequence": index = 5; break;
                case "search_time": index = 6; break;
            }
            $('#alarmTbl').dataTable().fnFilter( this.value, index );
        });
        $( 'input', this.footer() ).on( 'focus', function () { if ( this.className == "search_init" ) { this.className = ""; this.value = ""; } } );
        $( 'input', this.footer() ).on( 'blur', function () { if ( this.value == "" ) { this.className = "search_init"; this.value = this.title; } } );
    });
    // On row click, open the channel dialog
    $('#alarmTbl tbody').on( 'click', 'tr', function ()
    {
        /*
        var name = myTable.fnGetData(this)[1];
        chDialog.open(cell.name);
        */
    });
    
    // Init the dialog
    $( "#dialog" ).dialog({
        autoOpen: false,
        width: 700,
        modal: true,
        closed: true,
        buttons: [
            {
                text: "Ok",
                handler: function() {
                    $('#dialog').dialog('close');
                }
            },
            {
                text: "Cancel",
                handler: function() {
                    $('#dialog').dialog('close');
                }
            }
        ]
    });
    // Init the dialog
    $( "#diffDlg" ).dialog({
        autoOpen: false,
        width: 600,
        height: 500,
        modal: false,
        closed: true,
    });
    $("#consoleDialog").dialog({
        autoOpen: false,
        width: 700,
        modal: false,
        closed: true,
        buttons: [
            {
                text: "Ok",
                handler: function() {
                    $('#consoleDialog').dialog('close');
                }
            },
            {
                text: "Cancel",
                handler: function() {
                    $('#consoleDialog').dialog('close');
                }
            }
        ]
    });
	// Init the dialog
    $( "#about" ).dialog({
        autoOpen: false,
        width: 500,
		height: 400,
        modal: true,
        closed: true,
        buttons: [
            {
                text: "Ok",
                handler: function() {
                    $('#about').dialog('close');
                }
            },
            {
                text: "Cancel",
                handler: function() {
                    $('#about').dialog('close');
                }
            }
        ]
    });
    // Popup dialog
    $( "#popup" ).dialog({
        width: 700,
        modal: false,
        closed: true
    });
	$( "#testsDlg" ).dialog({
        width: 600,
		height: 300,
        modal: false,
        closed: true
    });
    $("#panels").layout('panel','west').panel({
        onCollapse:function(){},
        onExpand:function(){},
        onResize:function(w,h){ var newWidth = 0; if (w > 450) newWidth = 450; if (w < 300) newWidth = 300; if (newWidth) $("#panels").layout('panel','west').panel({width: newWidth});}
    });
    $("#panels").layout('panel','south').panel({
        onCollapse:function(){ $("#pendingNotification").text("0"); $("#pendingWarning").text("0"); $("#pendingCritical").text("0"); },
        onExpand:function(){ $('#alarmTbl').dataTable().api().draw(); },
        onResize:function(w,h){
			if (h > 600) $("#panels").layout('panel','south').panel({height: 600});
			$(".diffContent").css('height', h - 150);
		}
    });
    $("#panels").layout('panel','east').panel({ onResize:function(w,h){ $('#logDg').datagrid('resize'); $('#injectsDg').datagrid('resize'); $('#alarmTbl').dataTable().api().draw(); }});
	// Set the south title when expanded
	var p = $('#panels').layout('panel','expandSouth');
	if (p) p.panel('setTitle', $('#panels').layout('panel','south').panel('options').title);

    var p = $.data($("#panels")[0],"layout").panels;
    var title = p.west.panel('header').find('.panel-title');
    title.prepend('<div id="connStatus" class="icon-disconnect" style="float:left; margin-left: 8px; padding: 10px"></div>');
	/*
    var expandSouth = p.expandSouth;
    // header does not exist yet?
    if (expandSouth)
    {
        //p.expandSouth.panel({ title: "" });
        //title = p.south.panel('header').find('.panel-title');
        //title.prepend('<a href="#" id="menuAlarms" class="easyui-menubutton" iconCls="icon-alarm" menu="#mmAlarm">Alarms</a>');
        //btn = $('#menuAlarms');
        //btn.menubutton({disabled: false, plain: true});
        //p.expandSouth.panel({ title: "Alarms" });
        var tool = p.expandSouth.panel('header').find('.panel-tool');
        tool.prepend("<span class='alarmRed' style='margin-right: 80px; vertical-align:top' id='pendingCritical'>0</span>");
        tool.prepend("<span class='alarmYellow' style='margin-right: 10px; vertical-align:top' id='pendingWarning'>0</span>");
        tool.prepend("<span class='alarmGreen' style='margin-right: 10px; vertical-align:top' id='pendingNotification'>0</span>");
        tool.prepend("<span style='vertical-align:top; margin-right: 10px;'>Pending Alarms:</span>");
    }
	*/
    $("#tabs").tabs({
        border:false,
        fit:true,
        onSelect:function(title)
        {
            $('#alarmTbl').dataTable().api().draw();
            NanoAlarm.selected();
        } 
    });
    $("#chTabs").tabs({
        border:false,
        fit:true,
        onSelect:function(title)
        {
        } 
    });
	$('#viewPackages').change(function() {
        flowView.packageView(this.checked);
        NanoDb.updateSettings("showPackages", this.checked);
    });
    $('#aiEnabled').change(function() {
        NanoDb.updateSettings("aiEnabled", this.checked);
    });
	$('input[type=radio][name=viewType]').change(function() {
        setView(this.value);
        NanoDb.updateSettings("viewType", this.value);
	});
    // Autocomplete stuff
    new Awesomplete($("#findMethod")[0], { minChars: 1, list: Nanoware.getNames() });
    $("#findMethod").on('awesomplete-selectcomplete',function() {
        // Use "exacet match" if someone selected this result from the list
        $(this).val('"'+$(this).val()+'"');
        flowView.findMethod(true);
    });
    $('#findMethod').on('input',$.debounce(() =>  flowView.findMethod(false), 300));

    //$('#findMethod').on('awesomplete-close', () => $('#findMethod').blur());
    //new Awesomplete($("#findPipe")[0], { minChars: 1, list: Nanoware.getPipes });
    //$("#findPipe").on('awesomplete-selectcomplete', () => flowView.findPipe(true));
    //$("#findPipe").on('blur', () => flowView.findPipe(true));
    //$( "#findPipe" ).keypress(function( event ) { if ( event.which == 13 ) { $(this).blur(); }});
    //$('#findPipe').on('input',$.debounce(() => Nanoware.getView("Flow").findPipe(false), 300));
    // Resize
    $(window).resize(function () {
        var sel = $('#tabs').tabs('getSelected').panel('options').title;
        $('#tabs').tabs({fit:true});
        $('#tabs').tabs('select', sel);
        $("#panels").layout("resize");
        $('#alarmTbl').dataTable().api().draw();
    });
    $('#panels').show().resize();
    init();
});
var debug_times = 0;
function filter()
{
	NanoPkgs.filter();
}
function collapsePanel(who, collapse)
{
	var isCollapsed = $("#panels").layout('panel',who).panel('options').collapsed;
	//$("#panels").layout('panel','south').panel('options').collapsed = collapse;
	if (isCollapsed && !collapse) $("#panels").layout('expand',who);
	if (!isCollapsed && collapse) $("#panels").layout('collapse',who);
}
function setView(type)
{
	if (type == "monitor")
	{
		collapsePanel('south', true);
		collapsePanel('east', true);
	}
	else if (type == "debug")
	{
		collapsePanel('south', false);
		collapsePanel('east', false);
	}
}
function about()
{
	var s = NanoDb.getSettings();
	$('#aboutKey').html(s.license.key);
	$('#about').dialog('open');
}
function upgradeLicense()
{
	var key = $("#aboutKey").html();
	var lic = $("#aboutLic").val();
	if (lic === NanoLic.generate(key))
	{
		console.log("OK");
	}
	else
	{
		console.log("NOT OK");
	}
}
function debugGenerateLic()
{
	var key = $("#generateLic").val();
	var lic = NanoLic.generate(key);
	$("#generatedLic").html(lic);
}
function debug()
{
    flowView.debug();
    return;

    var o = {nodes: []};
    o.nodes.push({packageName:"org.snmp4j.mp",packageActive:true});
    o.nodes.push({packageName:"org.snmp4j.mp4",packageActive:false});
    o.nodes.push({packageName:"web",packageActive:false});
    o.nodes.push({packageName:"web2",packageActive:false});
    o.nodes.push({packageName:"com.google.co2",packageActive:false});
    o.nodes.push({packageName:"com.google.co3",packageActive:false});
    o.nodes.push({packageName:"com.google.co4",packageActive:false});
    o.nodes.push({packageName:"basecontroller",packageActive:false});
    o.nodes.push({packageName:"app.waveip.web",packageActive:true});
    NanoPkgs.onPackage(o);

}
function onSettings()
{
    var s = NanoDb.getSettings(),
        reconnect = s.general.reconnect || "Yes", mini = s.graph.showMini || "Yes", theme = s.general.theme || "Default", opacity = s.graph.opacity || "20", highlight = s.graph.highlight || "No", combine = s.graph.combine || "No";
        title = "Settings",
        data = [
			{"name":"Auto reconnect","value":reconnect,"group":"General Settings",editor:{type:'checkbox',options:{on:'Yes',off:'No'}}},
            {"name":"Show mini-view","value":mini,"group":"Graph Settings",editor:{type:'checkbox',options:{on:'Yes',off:'No'}}},
			{"name":"Combine edges","value":combine,"group":"Graph Settings",editor:{type:'checkbox',options:{on:'Yes',off:'No'}}},
            {"name":"Highlight on hover","value":highlight,"group":"Graph Settings",editor:{type:'checkbox',options:{on:'Yes',off:'No'}}},
            {"name":"Cells opacity (%)","value":opacity,"group":"Graph Settings",editor:{type:'combobox',options:{class:"easyui-combobox",valueField: 'value', textField: 'label', editable:false, data:[
                {label: '10%', value: '10'},
                {label: '20%', value: '20'},
                {label: '30%', value: '30'},
                {label: '40%', value: '40'},
                {label: '50%', value: '50'},
                {label: '60%', value: '60'},
                {label: '70%', value: '70'},
                {label: '80%', value: '80'}
                ]}}
            },
            //{"name":"Show Set/Get","value":setget,"group":"Graph Settings",editor:{type:'checkbox',options:{on:'Yes',off:'No'}}},
            {"name":"Theme","value":theme,"group":"Customization",editor:{type:'combobox',options:{class:"easyui-combobox",valueField: 'value', textField: 'label', editable:false, data:[
                {label: 'Default', value: 'Default'},
                {label: 'Gray', value: 'Gray'}
                ]}}
            },
        ];
    PropGrid.open(title, data, (d) =>
    {
		s.general.reconnect = d.rows[0].value;
        s.graph.showMini = d.rows[1].value;
		s.graph.combine = d.rows[2].value;
        s.graph.highlight = d.rows[3].value;
        s.graph.opacity = d.rows[4].value;
        s.general.theme = d.rows[5].value;
        NanoDb.updateSettings();
        loadSettings();
    });
}
function loadSettings()
{
    var s = NanoDb.getSettings();
    $("#easyuiStyle").attr("href","lib/jquery_easyui/themes/"+((s.general.theme === "Gray")?"gray":"default")+"/easyui.css");
    $("#outlineContainer").css("display", (s.graph.showMini == "No")?"none":"block");
    var opacity = s.graph.opacity || 20;
    var highlight = s.graph.highlight;
	var combine = s.graph.combine || "No";
    flowView.setCellOpacity(opacity);
    flowView.setHighlightCells(highlight === "Yes");
    flowView.setCombineEdges(combine === "Yes");
    $('#viewPackages').prop("checked", s.showPackages);
    $('#aiEnabled').prop("checked", s.aiEnabled);
    $('#displayFilterDuplicates').prop("checked", s.displayFilterDuplicates);
    $('#displaySmartScroll').prop("checked", s.displaySmartScroll);
    $('#displaySingleRow').prop("checked", s.displaySingleRow);
    $('#displayFocusSelected').prop("checked", s.displayFocusSelected);
    $('#displayRecordAll').prop("checked", s.displayRecordAll);
	$('input[type=radio][name=viewType]').val([s.viewType]);
	setView(s.viewType);
	flowView.packageView(s.showPackages);
}
function preloadImages()
{
    function preloadImg(url) { $("#preload").append( "<img src="+url+" width='1' height='1'/>" ); }
    preloadImg('images/folder_active.png');
    preloadImg('images/ok.png');
    preloadImg('images/doc.png');
    preloadImg('images/cancel.png');
    preloadImg('images/no.png');
    preloadImg('images/Trash.gif');
}
function addTab(title, content, fixed)
{
    if (fixed == undefined) fixed = false;
    if ($('#mainTabs').tabs('exists', title))
    {
        tab = $('#mainTabs').tabs('select', title);
        //return tab; //indicate tab already open....
    }
    else
    {
        //var content = '<iframe scrolling="auto" frameborder="0" src="'+url+'" style="width:100%;height:100%;"></iframe>';
        tab = $('#mainTabs').tabs('add',{
            title:title,
            content:content,
            closable:!fixed,
            selected:!fixed
        });
        //return true;
    }
    return tab;
}
function getSelectedTab()
{
    var pp = $('#mainTabs').tabs('getSelected');
    var tab = pp.panel('options');
    return tab;
}

function init()
{
	flowView = new MxDraw("mx_holder");
	recordView = new RecordView();
    chDialog = new ChannelDlg();
    PropGrid = new PropertyGrid();
	codeEditor = new CodeEditor();
    //NanoPkgs.init();
    sensorsDb = SensorsDb();
    // Init the DB. Returns a promise that gives array of channels as result.
    NanoDb.init()
    .then(
        result => {
            $("#fade").hide();
            loadSettings();
			NanoLic.init();
            NanoProject.init(result);
        },
        error => {
            $("#fade").html("Loading failed...<br><br>"+error);
            console.log(error)
        }
    )
    .finally(() => initWs())
    // Preload several images for better responsivness
    preloadImages();
}

var ws = null, wsTimer, isConnected;
function closeWs()
{
    clearTimeout(wsTimer);
    if (!ws || ws.readyState == 3)
    {
		return true;
    }
    ws.close();
    return false;
}
function reconnect(time)
{
	var s = NanoDb.getSettings();
	if (s.general.reconnect == "Yes")
		wsTimer = setTimeout(initWs, time);
}
// Init the websocket
function initWs()
{
    var project = NanoProject.getProject();
    if (!project) return;
    console.log("initWs");
    var ip = project.settings.ip,
        port = project.settings.port;
    // Close previous websocket if any
    if (!closeWs())
    {
		reconnect(200);
        return;
    }
    console.log("new ws");
    //var ws = new WebSocket("ws://3.18.236.154:8889");
    ws = new WebSocket("ws://"+ip+":"+port);
    ws.onopen = function() {
        $("#connStatus").attr("class","icon-connect");
        isConnected = true;
        console.log("Connected");
        // Delay all sends to the agent - give the target time to load
        setTimeout(() =>
        {
            NanoProject.sendSettings();
            NanoPkgs.sendPackages();
            NanoProject.sendInject();
        }, 2000);
    };
    ws.onclose = function(evt) {
        $("#connStatus").attr("class","icon-disconnect");
        isConnected = false;
        console.log("onclose");
        console.log(evt);
        if (evt.wasClean === false)
			reconnect(1000);
    };
    ws.onmessage = function(evt) {
		try
		{
			var msg = JSON.parse(evt.data);
			//console.log(msg);
			Nanobrain.input(msg);
		}
		catch(e)
		{
			console.log(e);
		}
    };
    ws.onerror = function(evt) {
        $("#connStatus").attr("class","icon-disconnect");
        isConnected = false;
		reconnect(1000);
        console.log(evt);
    };
}

function WSSend(c)
{
	if (isConnected)
    {
        var msg = JSON.stringify(c);
        //console.log("Sending: "+msg);
		ws.send(msg);
    }
}