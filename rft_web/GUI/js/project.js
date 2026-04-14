
var NanoProject = new function() {
    var that = {},
        currentProject = null,
        projTree, mainNode, oldName;

    that.init = function(result)
    {
        initProjectsTree(result);
        that.splashScreen(true);
    }
    findNode = (name) =>
    {
        var nodes = mainNode.childNodes, len = nodes.length;
        for (var i = 0; i < len; i++)
        {
            if (nodes[i].text === name)
                return nodes[i];
        }
        return null;
    }
    openByName = (name) =>
    {
        var node = findNode(name);
        if (!node) return;
        NanoProject.open(node)
    }
    that.splashScreen = (on) =>
    {
        if (on)
        {
            var recent = NanoDb.getSettings().recent;
            $("#recentProjects").html("");
            recent.forEach(o =>
            {
				if (NanoDb.projectExist(o))
				{
					var link = $("<a class='nicehref first after' href='javascript:undefined'>");
					link.text(o);
					$(link).click(function() { openByName(o) });
					$("#recentProjects").append(link);
					$("#recentProjects").append("<br>");
				}
            });
            $("#projectsDiv").show();
            $("#projectExplorer").hide();
        }
        else
        {
            $("#projectsDiv").hide();
            $("#projectExplorer").show();
        }
    }
    that.clearRecent = () =>
    {
        NanoDb.clearRecent();
        NanoProject.splashScreen(true);
    }
    that.add = function(settings)
    {
        var promise = NanoDb.add(settings);
        if (promise == null)
        {
            $.messager.alert('Error','Project name already exist!','error');
            return;
        }
        promise.then(() => that.addToTree(settings),
                     () => $.messager.alert('Error','Failed to add project.','error'));
    }
    initProjectsTree = function(result)
    {
        var contex_menu = {
            'context1' : {
                elements : [
                    {
                        title: true,
                    },
                    {
                        seperator: true,
                    },
                    {
                        text : 'Open Project',
                        icon: 'images/ok.png',
                        hideWhenActive: true,
                        action : function(node) {
                            that.open(node);
                        }
                    },
                    {
                        text : 'Close Project',
                        icon: 'images/no.png',
                        hideWhenNotActive: true,
                        action : function(node) {
                            that.close();
                        }
                    },
                    {
                        text : 'Project Properties',
                        icon: 'images/doc.png',
                        action : function(node) {
                            that.openProjectDialog(node.text);
                        }
                    },
                    {
                        seperator: true,
                    },
                    {
                        text : 'Export Data',
                        icon: 'images/export.png',
                        //hideWhenActive: true,
                        action : function(node) {
                            NanoDb.export(node.text);
                        }
                    },
					{
                        seperator: true,
                    },
                    {
                        text : 'Clear View',
                        icon: 'images/map_delete.png',
                        //hideWhenActive: true,
                        action : function(node) {
                            $.messager.confirm('Erase Project Graph','Are you sure you want to erase the graph structure for \"'+node.text+'\"?<br><br>Note: Project will be closed.',function(r){
                                if (r){
                                    that.deleteChannels(node.text);
                                }
                            });
                        }
                    },
					{
                        text : 'Erase Pipe Alias',
                        icon: 'images/Link.gif',
                        //hideWhenActive: true,
                        action : function(node) {
                            $.messager.confirm('Erase Project Data','Are you sure you want to erase all pipe aliases for \"'+node.text+'\"?<br><br>Note: Project will be closed.',function(r){
                                if (r){
                                    that.close();
                                    NanoDb.erasePipeAlias(node.text);
                                }
                            });
                        }
                    },
					{
                        text : 'Erase Activity',
                        icon: 'images/clock.png',
                        //hideWhenActive: true,
                        action : function(node) {
                            $.messager.confirm('Erase Project Data','Are you sure you want to erase activity properties for \"'+node.text+'\"?<br><br>Note: Project will be closed.',function(r){
                                if (r){
                                    that.close();
                                    NanoDb.eraseActivity(node.text);
                                }
                            });
                        }
                    },
                    {
                        text : 'Erase Injects',
                        icon: 'images/erase_inject.png',
                        //hideWhenActive: true,
                        action : function(node) {
                            $.messager.confirm('Erase Project Data','Are you sure you want to erase activity properties for \"'+node.text+'\"?<br><br>Note: Project will be closed.',function(r){
                                if (r){
                                    that.close();
                                    NanoDb.eraseInjects(node.text);
                                }
                            });
                        }
                    },
					{
                        text : 'Erase All Data',
                        icon: 'images/Trash.gif',
                        //hideWhenActive: true,
                        action : function(node) {
                            $.messager.confirm('Erase All Project Data','Are you sure you want to erase all data for \"'+node.text+'\"?<br><br>Note: Project will be closed.',function(r){
                                if (r){
                                    that.close();
                                    NanoDb.eraseData(node.text);
                                }
                            });
                        }
                    },
                    {
                        seperator: true,
                    },
                    {
                        text : 'Delete Project',
                        icon: 'images/cancel.png',
                        action : function(node) {
                            $.messager.confirm('Delete Project','Are you sure you want to delete project \"'+node.text+'\"?',function(r){
                                if (r){
                                    NanoDb.delete(node.text);
                                    node.removeNode();
                                }
                            });
                        }
                    }
                ]
            }
        };
        projTree = createTree('projTree','white',contex_menu);
        mainNode = projTree.createNode('<b>Projects</b>',true,'images/Home.gif',null,null,null);
        result.forEach(o => that.addToTree(o.settings));
        projTree.drawTree();
    }
    that.clear = () =>
    {
        $.messager.confirm('Clear Database','Are you sure you want to delete the entire databse? This will delete all projects.',function(r){
            if (r){
                NanoDb.deleteDb();
            }
        });
        
    }
    that.import = function(f)
    {
        var file = $('#importFile').prop('files');
        var reader = new FileReader();
        // Closure to capture the file information.
        reader.onload = (function(theFile)
        {
            return function(e)
            {
                try {
                    var rst = reader.result;
                    that.close();
                    var data = JSON.parse(rst);
                    that.add(data);
                }
                catch(e)
                {
                    console.log(e);
                    $.messager.alert('Error','Project could not be imported!','error');
                }
            };
        })(f);
        reader.readAsText(file[0]);
    }
    that.addToTree = function(o)
    {
        var node = mainNode.createChildNode(o.name,false,'images/folder.png',null,'context1', (node) => that.open(node));
        node.ip = o.ip;
        node.port = o.port;
    }
    that.openProjectDialog = function(projectName)
    {
        oldName = projectName;
        NanoDb.openProject(projectName)
        .then(
            result => {
                if (!result) return;
                var settings = result.settings,
                    name = settings.name,
                    base = settings.base,
                    ip = settings.ip,
                    port = settings.port,
                    email = settings.email,
                    user = settings.user,
                    filters = settings.filters,
					FILTER_ON = "Filter", FILTER_OFF = "Don't Filter",
                    privates = filters.privates ? FILTER_ON:FILTER_OFF,
                    getters = filters.getters ? FILTER_ON:FILTER_OFF,
                    setters = filters.setters ? FILTER_ON:FILTER_OFF,
                    toStrings = filters.toStrings ? FILTER_ON:FILTER_OFF,
                    hashCodes = filters.hashCodes ? FILTER_ON:FILTER_OFF,
                    title = "\"" + name + "\"" + " Properties",
                    data = [
                        {"name":"Project Name","value":name,"group":"Project Settings","editor":"text"},
                        {"name":"Base Package","value":base,"group":"Project Settings","editor":"text"},
                        {"name":"IP/URL","value":ip,"group":"Network Settings","editor":"text"},
                        {"name":"Port","value":port,"group":"Network Settings","editor":"text"},
                        {"name":"User Name","value":user,"group":"User Settings","editor":"text"},
                        {"name":"Email","value":email,"group":"User Settings","editor":{ "type":"validatebox", "options":{ "validType":"email" }}},
                        /*
                        {"name":"Private methods","value":privates,"group":"Filter Settings",editor:{type:'checkbox',options:{on:FILTER_ON,off:FILTER_OFF}}},
                        {"name":"Getters","value":getters,"group":"Filter Settings",editor:{type:'checkbox',options:{on:FILTER_ON,off:FILTER_OFF}}},
                        {"name":"Setters","value":setters,"group":"Filter Settings",editor:{type:'checkbox',options:{on:FILTER_ON,off:FILTER_OFF}}},
                        {"name":"toString","value":toStrings,"group":"Filter Settings",editor:{type:'checkbox',options:{on:FILTER_ON,off:FILTER_OFF}}},
                        {"name":"hashCode","value":hashCodes,"group":"Filter Settings",editor:{type:'checkbox',options:{on:FILTER_ON,off:FILTER_OFF}}},
                        */
                    ];
                PropGrid.open(title, data, (d) =>
                {
                    settings = {
                        name: d.rows[0].value,
                        base: d.rows[1].value,
                        ip: d.rows[2].value,
                        port: d.rows[3].value,
                        user: d.rows[4].value,
                        email: d.rows[5].value,
                        /*
                        filters:
                        {
                            privates: d.rows[5].value==FILTER_ON,
                            getters: d.rows[6].value==FILTER_ON,
                            setters: d.rows[7].value==FILTER_ON,
                            toStrings: d.rows[8].value==FILTER_ON,
                            hashCodes: d.rows[9].value==FILTER_ON,
                        }
                        */
                    };
                    if (!settings.name)
                    {
                        $.messager.alert('Error','Project properties missing!','error');
                        return;
                    }
                    if (oldName == "")
                    {
                        that.add(settings);
                    }
                    else
                    {
                        if (NanoDb.rename(oldName, settings) == false)
                        {
                            $.messager.alert('Error','Project name already exist!','error');
                            return;
                        }
                        projTree.setText(projTree.selectedNode, settings.name);
                    }
                });
            },
            error => console.log(error)
        )
    }
    that.new = function()
    {
        that.openProjectDialog("");
    }
    that.open = function(node)
    {
		$('#findMethod').val("");
        var name = node.text;
        if (currentProject != null)
            that.close();
        projTree.setActive(node);
        NanoDb.openProject(name)
        .then(
            result => {
                NanoDb.addRecent(result.settings.name);
                currentProject = result;
                Nanoware.init(result.channels);
                NanoProject.splashScreen(false);
                initWs();
            },
            error => console.log(error)
        )
    }
    that.close = function()
    {
        projTree.setActive(null);
        closeWs();
        currentProject = null;
        Nanoware.init([]);
        codeEditor.reset();
        that.splashScreen(true);
    }
    that.isOpen = function()
    {
        return (currentProject != null);
    }
    that.getProject = function()
    {
        return currentProject;
    }
    that.getChannel = function(name)
    {
        return currentProject.channels[name];
    }
    that.getChannels = function()
    {
        return currentProject.channels;
    }
    that.getChecks = function()
    {
        return currentProject.data.checks;
    }
    that.getTests = function()
    {
        return currentProject.data.tests;
    }
    that.getData = function()
    {
        return currentProject.data;
    }
    that.getInjects = function()
    {
        return currentProject.data.injects;
    }
    that.getActivity = function()
    {
        if (!currentProject) return null;
        return currentProject.data.activity;
    }
	that.getPipeAliasList = function()
    {
        return currentProject.data.pipeAlias;
    }
	that.getTriggerStart = function()
    {
        return currentProject.data.activity.triggerStart;
    }
	that.getTriggerStop = function()
    {
        return currentProject.data.activity.triggerStop;
    }
	that.getInList = function()
    {
        return currentProject.data.activity.list;
    }
	that.getPipeList = function()
    {
        return currentProject.data.activity.pipes;
    }
    that.update = function()
    {
        NanoDb.update(currentProject);
    }
	that.pipeAlias = (signature, alias) =>
	{
		var list = that.getPipeAliasList();
		if (alias == undefined)
		{
			alias = list[signature];
			if (alias == undefined) return "";
			return alias
		}
		else
		{
			if (alias === "") delete list[signature];
			else list[signature] = alias;
		}
	}
	that.getPipeAlias = function(name)
    {
		var chan = NanoProject.getChannel(name),
			pipe = chan.pipe,
			alias = NanoProject.pipeAlias(pipe);
		if (alias) return alias;
		return pipe;
    }
	that.triggerStart = (channel, value) =>
	{
		var o = that.getChannel(channel),
			list = that.getTriggerStart();
		if (value == undefined)
		{
			return list[channel];
		}
		else
		{
			if (value)
				list[channel] = o.name;
			else
				delete list[channel];
		}
	}
	that.triggerStop = (channel, value) =>
	{
		var o = that.getChannel(channel),
			list = that.getTriggerStop();
		if (value == undefined)
		{
			return list[channel];
		}
		else
		{
			if (value)
				list[channel] = o.name;
			else
				delete list[channel];
		}
	}
	that.inList = (channel, value) =>
	{
		var o = that.getChannel(channel),
			list = that.getInList();
		if (value == undefined)
		{
			return list[channel];
		}
		else
		{
			if (value)
				list[channel] = o.name;
			else
				delete list[channel];
		}
	}
	that.pipeList = (channel, value) =>
	{
		var o = that.getChannel(channel),
			list = that.getPipeList();
		if (value == undefined)
		{
			return list[o.pipe];
		}
		else
		{
			if (value)
				list[o.pipe] = o.pipe;
			else
				delete list[o.pipe];
		}
	}
	that.checks = (channel, value) =>
	{
		var list = that.getChecks();
		if (value == undefined)
		{
			return list[channel];
		}
		else
		{
			if (value.length != 0)
				list[channel] = value;
			else
				delete list[channel];
		}
	}
	that.tests = (channel, value) =>
	{
		var list = that.getTests();
		if (value == undefined)
		{
			return list[channel];
		}
		else
		{
			if (value.length != 0)
				list[channel] = value;
			else
				delete list[channel];
		}
	}
    that.inject = (channel, value) =>
	{
		var o = that.getChannel(channel),
			list = that.getInjects();
		if (value == undefined)
		{
			return list[channel];
		}
		else
		{
			if (value)
				list[channel] = value;
			else
				delete list[channel];
        }
        that.update();
        that.sendInject(channel);
    }
    that.getSoftTriggers = () =>
    {
        var list = that.getInjects();
        var ret = [];
        for (key in list)
        {
            var inject = list[key];
            var index = inject.indexOf("trigger");
            if (index != -1)
            {
                var start = inject.indexOf("(", index);
                var end = inject.indexOf(")", index);
                var result = inject.substring(start+2, end-1);
                ret.push(result);
            }
            /*
            if (inject.includes("trigger"))
            {
                var regExp = /\(([^)]+)\)/;
                var matches = regExp.exec(inject);
                ret.push(matches[1]);
            }
            */
        }
        return ret;
    }
    that.sendInject = (ch) =>
	{
		var list = that.getInjects();

        function send(name, code)
        {
            code = code || "";
            var channel = that.getChannel(name),
                sendToBc = { type: "nano_inject", codeNav: "body", channel: channel.name, source: channel.source, target: channel.target, filename: channel.filename, code: code };
            WSSend(sendToBc);
        }
        if (ch != undefined) // Send specific channel inject
        {
            send(ch, list[ch]);
        }
        else // Send all
        {
            for (ch in list)
            {
                send(ch, list[ch]);
            }
        }
	}
    that.sendSettings = (ch) =>
	{
        var settings = currentProject.settings,
            sendToBc = { type: "nano_filter", filterSettings: settings.filters};
        console.log(sendToBc);
        WSSend(sendToBc);
	}
    that.getGroups = () =>
    {
        return currentProject.data.groups;
    }
    that.addGroup = (name, group) =>
    {
        currentProject.data.groups[name] = group;
        that.update();
    }
    that.removeGroup = (name) =>
    {
        delete currentProject.data.groups[name];
        that.update();
    }
    that.renameGroup = (oldName, newName) =>
    {
        var groups = that.getGroups(), temp = groups[oldName];
        delete groups[oldName];
        that.addGroup(newName, temp);
    }
    that.deleteChannels = (name) =>
    {
        if (name)
        {
            that.close();
            NanoDb.eraseChannels(name);
        }
        else if (currentProject)
        {
            currentProject.channels = [];
            that.update();
            that.close();
        }
    }
    return that;
};