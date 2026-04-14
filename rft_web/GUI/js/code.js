function CodeEditor()
{
	var injectsData = [], isPutMarker = false;
	// Require the range module for markers handling
	var Range = require('ace/range').Range;
	var that, currentFile, methodMmarker, markerSelected;

    var differ = new AceDiff({
        //ace: window.ace, // You Ace Editor instance
        element: '.acediff',
        left: {
          editable: false,
          content: "",
          copyLinkEnabled: false,
          theme: "ace/theme/sqlserver",
          mode: "ace/mode/java",
        },
        right: {
          content: "",
          copyLinkEnabled: false,
          theme: "ace/theme/sqlserver",
          mode: "ace/mode/java",
        },
    });
    $(".acediff").find(".acediff__gutter").hide();
    var leftSide = $(".acediff").find(".acediff__left");
    $(".codeDiffContainer").append(leftSide);
    var diff = differ.getEditors(),
        left = diff.left,
        right = diff.right;
    right.session.on("changeScrollTop", function(e) { left.session.setScrollTop(e); })
    right.addEventListener("mousedown", function(e) {
        if (e.getButton() == 2)
        {
            setTimeout(function()
            {
                var pos = right.getCursorPosition();
                var token = right.session.getTokenAt(pos.row, pos.column);
                if (token && (token.type === "identifier"))
                {
                    if (currentFile)
                    {
                        currentFile.codeNav = "^";
                        currentFile.channel  = token.value;
                        currentFile.linenumber  = pos.row+1;
                        WSSend(currentFile);
                    }
                }
            },0);
        }
    })
    $("#codeNavDiff").click(function() {
		if (currentFile)
		{
			var diffs = differ.getNumDiffs();
            if (diffs == 0) return;
            $("#diffDlg").dialog("open");
		}
    });
	$("#codeNavReload").click(function() {
		if (currentFile)
		{
            currentFile.codeNav = "@";
			WSSend(currentFile);
		}
    });
    $("#codeNavBack").click(function() {
        if (currentFile)
        {
            currentFile.codeNav = "<";
            WSSend(currentFile);
        }
    });
    $("#codeNavForward").click(function() {
        if (currentFile)
        {
            currentFile.codeNav = ">";
            WSSend(currentFile);
        }
    });
    $("#codeNavUp").click(function() {
        if (currentFile)
        {
            currentFile.codeNav = "^";
            WSSend(currentFile);
        }
    });
    $("#codeNavDown").click(function() {
        if (currentFile)
        {
            currentFile.codeNav = "!";
            WSSend(currentFile);
        }
    });
	$("#codeNavSend").click(function() {
        if (currentFile)
        {
            if (true)//currentFile.codeNav == "@")
            {
                $.messager.confirm('Change Code', 'Change code for method "'+currentFile.channel+'" ?', function(res){
                    if (res) {
                        that.editInject(currentFile.name, right.session.getValue());
                    }
                });
            }
            else
            {
                $.messager.alert('Notice','To change running code please select a specific method','info');
            }
        }
    });
    $("#codeNavRevert").click(function() {
		if (currentFile)
		{
            that.deleteInject(currentFile.name, currentFile.channel);
		}
    });
    $('#injectsDg').datagrid(
    {
        onDblClickRow:function()
        {
            that.goto();
        }
    });
	this.init = () =>
	{
		that.reload();
    }
	this.reload = () =>
	{
		if (NanoProject.getProject())
		{
            injectsData = [];
			var list = NanoProject.getInjects();
			for (key in list)
			{
				var inject = list[key];
				var o = NanoProject.getChannel(key);
				if (o)
					injectsData.push({ name: o.name, source: o.source, target: o.target, channel: key });
			}
			$('#injectsDg').datagrid('loadData', injectsData);
		}
	}
	this.goto = () =>
	{
		var row = $('#injectsDg').datagrid('getSelected');
		if (row)
		{
			that.fetchMethod(row.channel);
		}
	}
	this.delete = () =>
	{
		var row = $('#injectsDg').datagrid('getSelected');
		if (row)
		{
			that.deleteInject(row.channel, row.name);
		}
	}
	this.editInject = (channel, code) =>
	{
		NanoProject.inject(channel, code);
		recordView.buildTriggers();
		that.reload();
	}
	this.deleteInject = (channel, name) =>
	{
        $.messager.confirm('Revert Code', 'Revert "'+name+'" back to the original code ?', function(res){
			if (res) {
                that.editInject(channel, "");
                that.getInject();
			}
		});
	}
    this.getInject = () =>
    {
        if (currentFile)
        {
            var channel = currentFile.name;
            var inject = NanoProject.inject(channel);
            if (inject != undefined)
                right.session.setValue(inject);
            else
                right.session.setValue(left.session.getValue());
        }
    }
    this.fetchFile = (name) =>
    {
		$("#tabs").tabs('select', 'Code');
		$("#codeNavTitleMethod").html("");
		$("#codeNavTitleFile").html("");
        $("#codeNavTitlePackage").html("");
        left.session.setValue("");
		right.session.setValue("");
        var o = NanoProject.getChannel(name),
			sendToAgent = { type: "nano_file", source: o.source, target: o.target, filename: o.filename, channel: o.name, linenumber: o.linenumber, packageName: o.packageName, sourceFile: o.sourceFile, currentTrail: o.currentTrail, tracePos: o.tracePos };
		//console.log(sendToAgent);
        WSSend(sendToAgent);
    }
	
	var fetchTimer, fetchedMethod, fetchX, fetchY;
	this.getMethod = (method,x,y) =>
	{
		if (method === fetchedMethod) return;
		clearTimeout(fetchTimer);
		fetchedMethod = method;
		fetchX = x;
		fetchY = y;
		if (method)
			fetchTimer = window.setTimeout(function() { that.fetchMethod(method); },300);
	}
	this.fetchMethod = (name) =>
    {
        var o = NanoProject.getChannel(name),
			sendToAgent = { type: "nano_file", source: o.source, target: o.target, filename: o.filename, channel: o.name, linenumber: o.linenumber, packageName: o.packageName, sourceFile: o.sourceFile, currentTrail: o.currentTrail, tracePos: 0, codeNav:"@" };
		//console.log(sendToAgent);
        WSSend(sendToAgent);
    }
	this.onFile = function(msg)
    {
        var fileName = msg.sourceFile.substr(msg.sourceFile.lastIndexOf("/")+1);
		$("#codeNavTitleFile").html(fileName);
        $("#codeNavTitlePackage").html(msg.packageName);
        $("#diffDlg").dialog("close");
		function setFile(file)
		{
			currentFile = msg;
			var temp = currentFile.channel;
			currentFile.channel = currentFile.name;
			currentFile.name = temp;
			//currentFile.payload = "";
			if (msg.codeNav == "@") that.getInject();
        }
        // Set the code to the editors
        $("#codeNavTitleMethod").html(msg.name);
        left.session.setValue(msg.payload);
        right.session.setValue(msg.payload);
        setFile(msg);
        collapsePanel('east', false);
        $('#tabs').tabs('select', "Code");
        /*
		if (msg.codeNav == "@")
		{
            $("#codeNavTitleMethod").html(msg.name);
            left.session.setValue(msg.payload);
            right.session.setValue(msg.payload);
			setFile(msg);
			collapsePanel('east', false);
			$('#tabs').tabs('select', "Code");
		}
		else
		{
            $("#codeNavTitleMethod").html("---");
			if (msg.linenumber > 0)
			{
				$("#tabs").tabs('select', 'Code');
                right.session.removeMarker(methodMmarker);
                left.session.setValue(msg.payload);
                right.session.setValue(msg.payload);
				//right.gotoLine(msg.linenumber,0,false);
				setFile(msg);
				if (isPutMarker)
				{
					var line = right.session.getLine(msg.linenumber-1),
						find = msg.name;
					var col = line.indexOf(find);
					// Put a marker if found the method name
					if (col != -1)
					{
						var range = new Range(msg.linenumber-1, col, msg.linenumber-1, col+find.length);
						methodMmarker = right.session.addMarker(range, "methodHighlight", "background");
					}
				}
			}
			else
			{
				right.session.setValue("No Code");
				// If its the first fetch (no codeNav) then show info tab
				if (msg.codeNav === undefined)
					$("#chTabs").tabs('select', 'Info');
			}
        }
        */
    }
    this.reset = () =>
    {
        $("#codeNavTitleMethod").html("");
		$("#codeNavTitleFile").html("");
        $("#codeNavTitlePackage").html("");
        right.session.setValue("");
        left.session.setValue("");
    }
	var logData = [];
	var logEnabled = true;
    this.log = function(o)
    {
		if (logEnabled)
		{
        	logData.unshift({ log: o, time: new Date().toLocaleTimeString('en-US', { hour12: false }) });
			$('#logDg').datagrid('loadData', logData);
		}
    }
    this.clearLog = function()
    {
        logData = [];
        $('#logDg').datagrid('loadData', logData);
	}
	this.enableLog = function()
	{
		logEnabled = !logEnabled;
		$("#logPause").linkbutton({iconCls: logEnabled?'icon-pause':'icon-play', text: logEnabled?"Pause":"Resume"});
	}
	that = this;
}