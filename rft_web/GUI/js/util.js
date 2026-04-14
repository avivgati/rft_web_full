
/****************************************************************************************************************/
/**
 * Debounce and throttle function's decorator plugin 1.0.5
 *
 * Copyright (c) 2009 Filatov Dmitry (alpha@zforms.ru)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */
(function($) {

$.extend({

	debounce : function(fn, timeout, invokeAsap, ctx) {

		if(arguments.length == 3 && typeof invokeAsap != 'boolean') {
			ctx = invokeAsap;
			invokeAsap = false;
		}

		var timer;

		return function() {

			var args = arguments;
            ctx = ctx || this;

			invokeAsap && !timer && fn.apply(ctx, args);

			clearTimeout(timer);

			timer = setTimeout(function() {
				!invokeAsap && fn.apply(ctx, args);
				timer = null;
			}, timeout);

		};

	},

	throttle : function(fn, timeout, ctx) {

		var timer, args, needInvoke;

		return function() {

			args = arguments;
			needInvoke = true;
			ctx = ctx || this;

			if(!timer) {
				(function() {
					if(needInvoke) {
						fn.apply(ctx, args);
						needInvoke = false;
						timer = setTimeout(arguments.callee, timeout);
					}
					else {
						timer = null;
					}
				})();
			}

		};

	}

});
})(jQuery);
/****************************************************************************************************************/


// Add some utility to the array prototype
Array.prototype.last = function(){
    if (this.length == 0) return "";
    return this[this.length - 1];
};
Array.prototype.add = function(msg, size){
    this.push(msg);
    if (this.length > size) this.shift();
};

console.log2 = function(txt)
{
    $("#consoleTxt").html(txt + "<br>" + $("#consoleTxt").html());
}

function convertHex(hex,opacity)
{
    if (!hex) return 'rgba(100,100,100,20)';
    hex = hex.replace('#','');
    r = parseInt(hex.substring(0,2), 16);
    g = parseInt(hex.substring(2,4), 16);
    b = parseInt(hex.substring(4,6), 16);
    result = 'rgba('+r+','+g+','+b+','+opacity/100+')';
    return result;
}
            
function Perf()
{
    var t0,t1,tlap,isMute = false;
    this.mute = function(m)
    {
        isMute = m;
    }
    this.start = function()
    {
        t0 = performance.now();
        tlap = t0;
    };
    this.elapsed = function()
    {
        t1 = performance.now();
        return (t1 - t0);
    };
    this.lap = function()
    {
        t1 = performance.now();
        var tmp = t1 - tlap;
        tlap = performance.now();
        return tmp;
    };
    this.stop = function()
    {
        t1 = performance.now();
    }
    this.mark = function(str)
    {
        t1 = performance.now();
        if (!isMute) console.log(str+" took " + (t1 - t0) + " milliseconds.");
        t0 = performance.now();
    }
    this.print = function()
    {
        if (!isMute) console.log("Call took " + (t1 - t0) + " milliseconds.");
    }
}

// Undo/Redo class to support flow view history
function UndoRedo()
{
    var undo = [], redo = [];
    this.add = function(x)
    {
        if (undo[undo.length-1] === x) return false;
        redo = [];
        undo.push(x);
        return true;
    };
    this.get = function()
    {
        if (undo.length > 0)
            return undo[undo.length-1];
        return null;
    }
    this.undo = function()
    {
        var x = undo.pop();
        if (x !== undefined) redo.push(x);
        return undo[undo.length-1];
    }
    this.redo = function()
    {
        var x = redo.pop();
        if (x !== undefined) undo.push(x);
        return x;
    }
    this.clear = function()
    {
        undo = [];
        redo = [];
    }
    this.canUndo = function() { return (undo[undo.length-1] !== undefined); }
    this.canRedo = function() { return (redo[redo.length-1] !== undefined); }
}

function PropertyGrid()
{
    var callback;
    $('#propGrid').propertygrid({
        showGroup: true,
        scrollbarSize: 0
    });
    $( "#propDialog" ).dialog({
        width: 500,
        height: 350,
        modal: true,
        closed: true,
        buttons: [
            {
                text: "Ok",
                handler: function() {
                    var data = $('#propGrid').propertygrid('getData');
                    if (callback) callback(data);
                    $('#propDialog').dialog('close');
                }
            },
            {
                text: "Cancel",
                handler: function() {
                    $('#propDialog').dialog('close');
                }
            }
        ]
    });
    this.open = (title, data, cb) =>
    {
        $("#propDialog").dialog({ title: title });
        $('#propGrid').propertygrid('loadData',
        {
            "total":data.length,
            "rows": data
        });
        callback = cb;
        $('#propDialog').dialog('open');
    }
}

// Used to get color from array of colors.
function ColorBank()
{
    var index = 0, colors = ["#1b70fc", "#d50527", "#158940", "#f898fd", "#24c9d7", "#cb9b64", "#866888", "#22e67a", "#e509ae", "#9dabfa", "#437e8a", "#b21bff", "#ff7b91", "#94aa05", "#ac5906", "#82a68d", "#fe6616", "#7a7352", "#f9bc0f", "#b65d66", "#07a2e6", "#c091ae", "#8a91a7", "#88fc07", "#ea42fe", "#9e8010", "#10b437", "#c281fe", "#f92b75", "#07c99d", "#a946aa", "#bfd544", "#16977e", "#ff6ac8", "#a88178", "#5776a9", "#678007", "#fa9316", "#85c070", "#6aa2a9", "#989e5d", "#fe9169", "#cd714a", "#6ed014", "#c5639c", "#c23271", "#698ffc", "#678275", "#c5a121", "#a978ba", "#ee534e", "#d24506", "#59c3fa", "#ca7b0a", "#6f7385", "#9a634a", "#48aa6f", "#ad9ad0", "#d7908c", "#6a8a53", "#8c46fc", "#8f5ab8", "#fd1105", "#7ea7cf", "#d77cd1", "#a9804b", "#0688b4", "#6a9f3e", "#ee8fba", "#a67389", "#9e8cfe", "#bd443c", "#6d63ff", "#d110d5", "#798cc3", "#df5f83", "#b1b853", "#bb59d8", "#1d960c", "#867ba8", "#18acc9", "#25b3a7", "#f3db1d", "#938c6d", "#936a24", "#a964fb", "#92e460", "#a05787", "#9c87a0", "#20c773", "#8b696d", "#78762d", "#e154c6", "#40835f", "#d73656", "#1afd5c", "#c4f546", "#3d88d8", "#bd3896", "#1397a3", "#f940a5", "#66aeff", "#d097e7", "#fe6ef9", "#d86507", "#8b900a", "#d47270", "#e8ac48", "#cf7c97", "#cebb11", "#718a90", "#e78139", "#ff7463", "#bea1fd"];
    const cyrb53 = function(str, seed = 0) {
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
        h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1>>>0);
    };
    this.init = function()
    {
        index = 0;
    }
    this.get = function()
    {
        var clr = colors[index++];
        if (index >= colors.length) index = 0;
        return clr;
    }
    this.getFromString = function(str)
    {
        var hash = cyrb53(str);
        var color = hash % colors.length;
        return colors[color];
    }
}

// Search a tree for an item
function searchTree(root, what)
{
    if(root.name == what)
        return root;
    else if (root.children != null)
    {
        var i,
            result = null;
        for(i=0; result == null && i < root.children.length; i++)
            result = searchTree(root.children[i], what);
        return result;
    }
    return null;
}

// Encapsulate the channel dialog functionality
function ChannelDlg()
{
    var that, currentChannel;
    var theCheckDiv;

    // Channel dialog
    $( "#chDlg" ).dialog({
        width: 800,
        height: 750,
        top: 20,
        modal: false,
        closed: true,
        buttons: [
            {
                text: "Ok",
                handler: function() {
                    chDialog.save();
                    $('#chDlg').dialog('close');
                }
            },
            {
                text: "Cancel",
                handler: function() {
                    $('#chDlg').dialog('close');
                }
            }
        ]
    });
    // Popup dialog
    $( "#qBuilderPopup" ).dialog({
        width: 700,
        modal: true,
        closed: true,
        buttons: [
            {
                text: "Ok",
                handler: function() {
                    var user = theCheckDiv.data('user');
                    user.check = $("#builder").queryBuilder('getRules');
                    user.action = $("#checkAction").val();
                    user.global = $("#checkGlobal").prop('checked');
                    user.disabled = $("#checkDisabled").prop('checked');
                    that.updateCheckRow(theCheckDiv);
                    $('#qBuilderPopup').dialog('close');
                }
            },
            {
                text: "Cancel",
                handler: function() {
                    $('#qBuilderPopup').dialog('close');
                }
            }
        ]
    });
    $("#chAddCheck").click(function() {
        that.addCheckRow({}, true);
    });
    $("#chAddTest").click(function() {
        that.addTestRow("", false);
    });
    this.updateCheckRow = function(div)
    {
        var user = div.data('user');
        if (!user.check) return;
        function buildRule(rules, c)
        {
            var out = "(";
            var len = rules.length;
            for (var i = 0; i < len; i++)
            {
                var e = rules[i];
                if (e.condition)
                {
                    out += buildRule(e.rules, e.condition);
                }
                else
                {
                    out += "(" + e.value + ")";
                }
                if (i !== len-1) out += " " + c + " ";
            }
            out += ")";

            return out;
        }
        var aaa = buildRule(user.check.rules, user.check.condition);
        // Build the eval sentence
        user.eval = "if " + aaa.replace(new RegExp("OR", 'g'),"||").replace(new RegExp("AND", 'g'),"&&") + " " + user.action;
        var txt = "<b>Condition:</b><br>"+aaa+"<br><br>";
        txt += "<b>Action:</b><br>"+user.action+"<br><br>";
        txt += "<b>Properties:</b><br>"
        if (user.global) txt += "Check is global<br>";
        if (user.disabled) txt += "Check is disabled<br>";
        div.css("background-color", user.disabled?"#eee":"white");
        div.find(".checkRowContent").html(txt);
    }
    this.addCheckRow = function(val, isNew)
    {
        var div = $("<div class='checkRow'>").html("<div class='checkRowWrapper'><div class='checkRowContent'></div><br><a href='#' iconCls='icon-edit' class='easyui-linkbutton checkEdit'>Edit</a><a href='#' style='margin-left: 10px;' iconCls='icon-cancel' class='easyui-linkbutton checkDelete'>Delete</a></div>");
        var edit = div.find(".checkEdit");
        var del = div.find(".checkDelete");
        edit.linkbutton();
        del.linkbutton();
        div.data('user', val); //sets it
        edit.on('click', function()
        {
            $('#builder').queryBuilder({
                default_filter: 'name',
                filters: [{
                    id: 'name',
                    label: 'Name',
                    type: 'string',
                    size: 80
                }]
            });
            var user = div.data('user');
            try {
                $('#builder').queryBuilder('setRules', user.check);
            } catch (error) {
                //console.log(error);
            }
            theCheckDiv = div;
            $("#checkAction").val(user.action);
            $("#checkGlobal").prop('checked', (user.global === true));
            $("#checkDisabled").prop('checked', (user.disabled === true));
            $("#qBuilderPopup").dialog({ title: "Check details" });
            $("#qBuilderPopup").dialog( "open" );
        });
        del.on('click', function()
        {
            div.remove();
        });
        $('#chCheckContent').append(div);
        that.updateCheckRow(div);
        if (isNew) edit.trigger("click");
    }
    this.addTestRow = function(val, disabled)
    {
        var div = $("<div class='testRow'>").html("<textarea class='testTxt'>"+val+"</textarea>");
        div.children(".testTxt").prop('disabled', disabled);
        $('#chTestContent').append(div);
        div.panel({
            width:500,
            height:80,
            title:'Test Condition Evaluation',
            tools:[{
                        iconCls:'icon-switch',
                        handler: function(){ div.children(".testTxt").prop('disabled', function(i, v) { return !v; }); }
                    },
                    {
                        iconCls:'icon-delete',
                        handler: function(){ div.panel('destroy'); }
                    }
                ]
        });
    }
    this.open = function(name)
    {
        var o = NanoProject.getChannel(name);
        if (!o) return;
        currentChannel = name;

		var data = NanoProject.getData();
        // Get the real name
        name = o.name;

        $("#chDlg").dialog({ title: "Channel \"" + name + "\"" });
        var title = $( "#chDlg" ).panel('header').find('.panel-title');
        title.html("Channel \"" + name + "\"");
        $('#chCheckContent').html("");
        $('#chTestContent').html("");

        // Fill the Info tab
        var txt = "";
        for (var key in o)
        {
            if ((key == "messages") || (key == "stats") || (key == "checks") || (key == "tests")) continue;
            var val = o[key];
            txt += "<div style='margin:5px 10px;'>";
            txt += "<span style='font-weight: bold'>"+key+": </span>";
            if (Array.isArray(val))
            {
                val.forEach(function(e)
				{
					if (typeof e === "object")
					{
						var str = JSON.stringify(val, null, 4);
						txt += "<span>"+str+"</span>";
					}
                    else
					{
						txt += "<br><span>"+e+"</span>";
					}
                });
            }
			else
            {
                txt += "<span>"+val+"</span>";
            }
            
            txt += "</div>";
        }

        txt += "<span style='margin:5px 10px;font-weight: bold'>Alias: </span><input id='pipeAlias' value="+NanoProject.pipeAlias(o.pipe)+"><br>";
        txt += "<span style='margin:5px 10px;font-weight: bold'>Trigger Start: </span><input type='checkbox' id='triggerStart'><br>";
        txt += "<span style='margin:5px 10px;font-weight: bold'>Trigger Stop: </span><input type='checkbox' id='triggerStop'><br>";
        txt += "<span style='margin:5px 10px;font-weight: bold'>In List: </span><input type='checkbox' id='triggerInList'><br>";
		txt += "<span style='margin:5px 10px;font-weight: bold'>Add pipe: </span><input type='checkbox' id='triggerPipe'><br>";
        $("#chInfoContent").html(txt);
        // Fill the triggers
        $("#triggerStart").prop('checked', NanoProject.triggerStart(currentChannel));
        $("#triggerStop").prop('checked', NanoProject.triggerStop(currentChannel));
        $("#triggerInList").prop('checked', NanoProject.inList(currentChannel));
		$("#triggerPipe").prop('checked', NanoProject.pipeList(currentChannel));
        // Fill the Alerts tab
        txt = "";
        if (Array.isArray(o.alerts))
        {
            o.alerts.forEach(function(e) {
                txt += "<br><span>"+e+"</span>";
            });
        }
        $("#chAlertContent").html(txt);
        var checks = NanoProject.checks(currentChannel);
        // Fill the Check tab
        if (checks)
        {
            checks.forEach(function(e) {
                that.addCheckRow(e, false);
            });
        }
        var tests = NanoProject.tests(currentChannel);
        // Fill the Test tab
        if (tests)
        {
            tests.forEach(function(e) {
                that.addTestRow(e.test, e.disabled);
            });
        }
        // Finally open the dialog
        $("#chDlg").dialog( "open" );
    };

    this.isGlobal = function(name)
    {
        if (name.indexOf("expired") != -1) return true;
        return false;
    }
    this.save = function()
    {
        var edge = NanoProject.getChannel(currentChannel);

        // Checks
        var tempArray = [];
        $("#chCheckContent").find(".checkRow").each(function() {
            var user = $(this).data('user');
            if (user) tempArray.push({ check: user.check, action: user.action, eval: user.eval, global: user.global, disabled: user.disabled });
        });
		NanoProject.checks(currentChannel, tempArray);

        // Tests
        tempArray = [];
        $("textarea.testTxt").each(function() {
            var txt = $(this).val();
            if (txt != "") tempArray.push({ test: txt, global: that.isGlobal(txt), disabled: $(this).prop('disabled') });
        });
		NanoProject.tests(currentChannel, tempArray);

        // Alias
		NanoProject.pipeAlias(edge.pipe, $('#pipeAlias').val());
        // Triggers
		NanoProject.triggerStart(currentChannel, $("#triggerStart").prop('checked'));
		NanoProject.triggerStop(currentChannel, $("#triggerStop").prop('checked'));
		NanoProject.inList(currentChannel, $("#triggerInList").prop('checked'));
		NanoProject.pipeList(currentChannel, $("#triggerPipe").prop('checked'));
        // Update
        NanoProject.update();
    };
    that = this
}



var NanoAlarm = new function() {
    var aoid = 0, pending = 0, that = this;
    function formatDate(d)
    {
        function pad(num, len) { return (num+"").length >= len ? num + "" : pad("0" + num, len); }
        return pad(d.getDate(),2)+"/"+pad(d.getMonth()+1,2)+" "+pad(d.getHours(),2)+":"+pad(d.getMinutes(),2)+":"+pad(d.getSeconds(),2);
    }
    this.clear = function()
    {
        $('#alarmTbl').dataTable().fnClearTable();
    }

    this.setTitle = () =>
    {
        var tab = $("#tabs").tabs('getTab', 4);
        var title = "Alarms ("+pending+")";
        if (pending) title = "<span style='color:red'>"+title+"</span>";
        $("#tabs").tabs('update', {
            tab: tab,
            options: {
                title: title
            }
        });
    }
    this.add = function(channel, severity, alarm)
    {
        aoid++;
        var date = formatDate(new Date());
        $('#alarmTbl').dataTable().fnAddData([aoid, channel, severity, alarm, date], false); // Do not redraw the table
        $('#alarmTbl').dataTable().fnDraw(false); // Draw now, but don't Re-filter and don't resort.
        pending++;
        that.setTitle();
    }
    this.selected = () =>
    {
        pending = 0;
        that.setTitle();
    }
}

var NanoPkgs = new function()
{
    var tree, root, original;
    this.init = () =>
    {
        if (!tree)
        {
            $("#tree").fancytree({
                extensions: ["filter"],
                source: [],
                quicksearch: true,
                selectMode: 3,
                checkbox: true,
                filter: {
                        autoApply: true,   // Re-apply last filter if lazy data is loaded
                        autoExpand: false, // Expand all branches that contain matches while filtered
                        counter: true,     // Show a badge with number of matching child nodes near parent icons
                        fuzzy: false,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
                        hideExpandedCounter: true,  // Hide counter badge if parent is expanded
                        hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
                        highlight: true,   // Highlight matches by wrapping inside <mark> tags
                        leavesOnly: false, // Match end nodes only
                        nodata: true,      // Display a 'no data' status node if result is empty
                        mode: "dimm"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
                },
                activate: function(event, data) {
                    var node = data.node,
                        focusOn = node,
                        o = node.o;
                    if (node.type == "method")
                    {
                        var sendToAgent = { type: "nano_file", filename: o.filename, treeName: o.treeName, codeNav:"@" };
                        WSSend(sendToAgent);
                        focusOn = node.getParent();
                    }
                    var name = focusOn.title;
                    var cell = flowView.findNode(name);
                    if (cell)
                        flowView.changeView(cell);
                },
            });
            $("#treeSearch").on("keyup", function(e){
                var match = $(this).val();
                if (match)
                    tree.filterNodes(match);
                else
                    tree.clearFilter();
            }).focus();
            tree = $.ui.fancytree.getTree("#tree");
            root = tree.getRootNode();
        }
        else
        {
            tree.clear();
        }
    }
    this.onPackage = function(o)
    {
        original = o;
        // Fill the tree
        o.nodes.forEach(function(node)
        {
			NanoPkgs.add(node);
        });
        // Sort the tree to make all "folder" nodes in the top
        root.sortChildren(function(a,b) { if (a.isFolder() === b.isFolder()) return a.title.localeCompare(b.title); return a.isFolder() ? -1 : 1; }, true);
        tree.render(true,true);
    }
    this.reload = function()
    {
        // Tree not loaded yet?
        if (!original) return;
        // Reload the original tree
        original.nodes.forEach(function(node)
        {
            var n = tree.getNodeByKey(node.packageName);
            if (n) n.setSelected(node.packageActive);
        });
    }
    this.add = function(o)
    {
		if (o == "") return;
		function addToPkgTree(txt, o)
        {
            var node;
            if (txt == "")
                node = root;
            else
                node = tree.getNodeByKey(txt);
			if (node) return node;
			var me = txt.substr(txt.lastIndexOf(".")+1);
			var parent = txt.substr(0, txt.lastIndexOf("."));
			var n = addToPkgTree(parent);
            if (!n) return;
			nn = n.addChildren({
                    title: me,
					tooltip: txt,
                    key: txt,
                    expanded: false,
					folder: false
                });
            nn.o = o;
            // Added a child to n, so its a folder
            n.folder = true;
            n.icon = "./images/folder.png";
            n.type = "package";
            nn.icon = "./images/java.png";
            nn.type = "package";
            var parentheses = txt.lastIndexOf("(");
            if (parentheses > 0)
            {
                nn.icon = "./images/doc.png";
                nn.type = "method";
                n.icon = "./images/class.png";
                n.type = "class";
            }
			return nn;
        }
        var node = addToPkgTree(o.packageName, o);
        if (o.packageActive && !node.hasChildren())
        {
            node.setSelected(true);
        }
    }
    this.send = (nodes) =>
    {
        if (!nodes) nodes = [];
        var base = NanoProject.getProject().settings.base;
        if (!base) base = null;
        var sendToBc = { type: "nano_package", packageName: base, nodes: nodes };
        console.log(sendToBc);
        WSSend(sendToBc);
    }
    this.sendPackage = function()
    {
        var nodes = [];
        tree.getSelectedNodes().forEach((n) =>
        {
            if (n.isFolder()) return;
            nodes.push({packageName: n.key, packageActive: true});
        });
        NanoProject.getProject().packages = nodes;
        NanoProject.update();
        NanoPkgs.send(nodes);
    }
    this.sendPackages = function()
    {
        var packages = NanoProject.getProject().packages;
        NanoPkgs.send(packages);
    }
}

var Utils = new function()
{
	this.uuid = () =>
	{
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}
	this.randomIntFromInterval = (min, max) =>
	{
		return Math.floor(Math.random() * (max - min + 1) + min);
	}
	this.MD5 = (string) =>
	{
		function RotateLeft(lValue, iShiftBits) {
			return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
		}

		function AddUnsigned(lX,lY)
		{
			var lX4,lY4,lX8,lY8,lResult;
			lX8 = (lX & 0x80000000);
			lY8 = (lY & 0x80000000);
			lX4 = (lX & 0x40000000);
			lY4 = (lY & 0x40000000);
			lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
			if (lX4 & lY4) {
				return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
			}
			if (lX4 | lY4) {
				if (lResult & 0x40000000) {
					return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
				} else {
					return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
				}
			} else {
				return (lResult ^ lX8 ^ lY8);
			}
		}

		function F(x,y,z) { return (x & y) | ((~x) & z); }
		function G(x,y,z) { return (x & z) | (y & (~z)); }
		function H(x,y,z) { return (x ^ y ^ z); }
		function I(x,y,z) { return (y ^ (x | (~z))); }

		function FF(a,b,c,d,x,s,ac) {
			a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
			return AddUnsigned(RotateLeft(a, s), b);
		};

		function GG(a,b,c,d,x,s,ac) {
			a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
			return AddUnsigned(RotateLeft(a, s), b);
		};

		function HH(a,b,c,d,x,s,ac) {
			a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
			return AddUnsigned(RotateLeft(a, s), b);
		};

		function II(a,b,c,d,x,s,ac) {
			a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
			return AddUnsigned(RotateLeft(a, s), b);
		};

		function ConvertToWordArray(string) {
			var lWordCount;
			var lMessageLength = string.length;
			var lNumberOfWords_temp1=lMessageLength + 8;
			var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
			var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
			var lWordArray=Array(lNumberOfWords-1);
			var lBytePosition = 0;
			var lByteCount = 0;
			while ( lByteCount < lMessageLength ) {
				lWordCount = (lByteCount-(lByteCount % 4))/4;
				lBytePosition = (lByteCount % 4)*8;
				lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
			lByteCount++;
			}
			lWordCount = (lByteCount-(lByteCount % 4))/4;
			lBytePosition = (lByteCount % 4)*8;
			lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
			lWordArray[lNumberOfWords-2] = lMessageLength<<3;
			lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
			return lWordArray;
		};

		function WordToHex(lValue) {
			var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
			for (lCount = 0;lCount<=3;lCount++) {
				lByte = (lValue>>>(lCount*8)) & 255;
				WordToHexValue_temp = "0" + lByte.toString(16);
				WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
			}
			return WordToHexValue;
		};

		function Utf8Encode(string) {
			string = string.replace(/\r\n/g,"\n");
			var utftext = "";

			for (var n = 0; n < string.length; n++) {
				var c = string.charCodeAt(n);

				if (c < 128) {
					utftext += String.fromCharCode(c);
				}
				else if((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				}
				else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}
			}

			return utftext;
		};

		var x=Array();
		var k,AA,BB,CC,DD,a,b,c,d;
		var S11=7, S12=12, S13=17, S14=22;
		var S21=5, S22=9 , S23=14, S24=20;
		var S31=4, S32=11, S33=16, S34=23;
		var S41=6, S42=10, S43=15, S44=21;

		string = Utf8Encode(string);

		x = ConvertToWordArray(string);

		a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

		for (k=0;k<x.length;k+=16)
		{
			AA=a; BB=b; CC=c; DD=d;
			a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
			d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
			c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
			b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
			a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
			d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
			c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
			b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
			a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
			d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
			c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
			b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
			a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
			d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
			c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
			b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
			a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
			d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
			c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
			b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
			a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
			d=GG(d,a,b,c,x[k+10],S22,0x2441453);
			c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
			b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
			a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
			d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
			c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
			b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
			a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
			d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
			c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
			b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
			a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
			d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
			c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
			b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
			a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
			d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
			c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
			b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
			a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
			d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
			c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
			b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
			a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
			d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
			c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
			b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
			a=II(a,b,c,d,x[k+0], S41,0xF4292244);
			d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
			c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
			b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
			a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
			d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
			c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
			b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
			a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
			d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
			c=II(c,d,a,b,x[k+6], S43,0xA3014314);
			b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
			a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
			d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
			c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
			b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
			a=AddUnsigned(a,AA);
			b=AddUnsigned(b,BB);
			c=AddUnsigned(c,CC);
			d=AddUnsigned(d,DD);
		}

		var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);

		return temp.toLowerCase();
	}
}

var NanoLic = new function() {
    var that = {}, dbDize = 0;
    that.init = function()
    {
		var settings = NanoDb.getSettings();
		if (!settings.license)
		{
			var lic = {};
			lic.uuid = Utils.uuid();
			lic.key = Utils.MD5(lic.uuid+"key_from_uuid");
			settings.license = lic;
			NanoDb.updateSettings();
		}
    }
	that.generate = (key) =>
	{
		return Utils.MD5(key+"license_from_key");
	}
	that.setDbSize = (size) =>
	{
		dbSize = size;
	}
	return that;
};


function addToTree(o, n, txt, expand)
{
    if (o == null) o == "null";//return;
    var node;
    if (typeof (o) == 'object' && o != null)
    {
        node = n.addChildren({
            title: txt,
            tooltip: txt,
            key: txt,
            value: o,
            expanded: expand,
            folder: true
        });
        var temp = Object.entries(o);
        if (temp.length > 50) temp = temp.slice(0,50);
        temp.forEach(([key, value]) => addToTree(value, node, key, false) );
    }
    else
    {
        node = n.addChildren({
            title: txt+" : "+o,
            tooltip: txt,
            key: txt,
            value: o,
            expanded: expand,
            folder: false
        });
    }
    return node;
}

function makeTree(temp)
{
    var test = $('<div/>',{ class: 'argumentsTree' });
    $(test).fancytree({
        source: [],
        quicksearch: true,
        selectMode: 3,
        checkbox: false,
        filter: {
                autoApply: true,   // Re-apply last filter if lazy data is loaded
                autoExpand: true, // Expand all branches that contain matches while filtered
                counter: true,     // Show a badge with number of matching child nodes near parent icons
                fuzzy: false,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
                hideExpandedCounter: true,  // Hide counter badge if parent is expanded
                hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
                highlight: true,   // Highlight matches by wrapping inside <mark> tags
                leavesOnly: false, // Match end nodes only
                nodata: true,      // Display a 'no data' status node if result is empty
                mode: "dimm"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
        }
    });
    var theTree = $.ui.fancytree.getTree($(test));
    var obj = {}, root, title = temp.name+"(";
    if (temp.args)
    {
        var args = [];
        Object.keys(temp.args).forEach((o) =>
        {
            var argFull = temp.args[o];
            argFull = argFull.substr(argFull.lastIndexOf(".")+1);
            var argName = argFull.substr(argFull.lastIndexOf(" ")+1);
            args.push(argFull);
            obj[argName] = temp.argValues[o];
        });
        title += args.join(",");
    }
    else
    {
    }
    title += ")";
    root = theTree.getRootNode();
    var methodNode = addToTree(obj, root, title, true);
    var argumentsNodes = methodNode.getChildren();
    // Sort only the arguments children, but leave the arguments nodes in order
    if (argumentsNodes)
    {
        argumentsNodes.forEach((node) => {
            node.sortChildren(function(a,b) { if (a.isFolder() && b.isFolder()) return a.title.localeCompare(b.title); return a.isFolder() ? -1 : 1; }, true);
        });
    }
    return theTree;
}