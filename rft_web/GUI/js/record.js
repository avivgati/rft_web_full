    
function RecordView()
{
    var index = 0, activityTimer, triggered, that = this, perf = new Perf(), filterData = [], testsDgData = [], testNode, testName;
	var LEFT = "L", RIGHT = "R", rec_pos = LEFT;
	// Filter records by methods input change handler
	$('#recordsSearch').on('input',$.debounce(() =>  recordView.filterRecords(), 300));
	// Globals tree
	$("#globalsTree").fancytree({
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
		},
		activate: function(event, data) {
			console.log(data);
			var node = data.node;
			if (node.folder) return;
			$("#globalsKey").val(node.key);
			$("#globalsValue").val(node.data.value);
		},
	});
	$("#globalsAdd").on('click', function() {
		var theTree = $.ui.fancytree.getTree($("#globalsTree"));
		var key = $("#globalsKey").val(), val = $("#globalsValue").val();
		that.addToGlobals(key,val);
	});
	$("#globalsDel").on('click', function() {
		var theTree = $.ui.fancytree.getTree($("#globalsTree"));
		var key = $("#globalsKey").val();
		that.delFromGlobals(key);
	});
	/************************ A recorder column **********************************************/
	var recorder = function(side)
	{
		var activityRecords = [], activeLinks = [], that = this, recordTimer;
		$("#activityStart"+side).on('click', function() {
			if ($(this).linkbutton('options').disabled) return;
			$("#recordsSearch").val("");
			if (!that.isRecording())
			{
				var activity = NanoProject.getActivity();
				$(this).linkbutton({iconCls: 'icon-stop'});
				that.reset();
				isStarted = true;
				WSSend({ type: "nano_test", globals: recordView.getGlobals(), test: { id: "uuid", action: 'start_clear' } });
				recordView.start(side);
				recordTimer = setTimeout(that.stop, activity.maxTime*1000);
			}
			else
			{
				if (isStarted) WSSend({ type: "nano_test", test: { id: "uuid", action: 'stop' } });
				clearTimeout(recordTimer);
				$('#activityStart'+side).linkbutton({iconCls: 'icon-record'});
				if (activityRecords.length > 0)
				{
					//activityRecords.forEach((o) => { var link = flowView.findLink(o.channel); console.log(link); link.inView = true; })
					if ($("#displayRecordAll").prop('checked')) $("#findMethod").val("");
					flowView.setVisibility(false);
					recordView.fillRecordsDg();
				}
				else
				{
					console.log("ActivityHandler: nothing recorded!");
				}
			}
			recordView.setButtons();
		});
		$("#activityClose"+side).on('click', function() {
			if ($(this).linkbutton('options').disabled) return;
			that.reset();
			recordView.runSingle(0);
			flowView.setVisibility(false);
			that.setButtons();
		});
		$("#activitySave"+side).on('click', function() {
			if (that.isRecording()) return;
			$.messager.prompt('Save as...', 'Please enter test name:', function(r){
				if (r)
				{
					var tests = NanoProject.getTests();
					tests[r] = { name: r, date: new Date(Date.now()).toLocaleString(), records: activityRecords };
					NanoProject.update();
					recordView.buildTests();
				}
			});
		});
		$("#activityLoad"+side).on('click', function() {
			if ($(this).linkbutton('options').disabled) return;
			$("#testsDlg").data("to", side);
			$("#testsDlg").dialog("open");
		});
		this.reset = () =>
		{
			var p = NanoProject.getProject();
			$("#activityStart"+side).linkbutton(p ? 'enable':'disable');			
			if (!p)
				$("#activityStart"+side).linkbutton({iconCls: 'icon-record'});
			activityRecords = [];
			activeLinks = [];
			recordView.fillRecordsDg();
			recordView.setButtons();
		}
		this.getRecord = (i) =>
		{
			return activityRecords[i];
		}
		this.getRecords = () =>
		{
			return activityRecords;
		}
		this.isLinkActive = (name) =>
		{
			return (activeLinks[name] != undefined);
		}
		this.record = (o) =>
		{
			activityRecords.push(o);
			activeLinks[o.channel] = true;
			$("#activityIndex"+side).html(index+" - "+activityRecords.length);
			$("#activityTime"+side).html((o.time/1000).toFixed(2)+" Sec");
			return that.getLength();
		}
		this.stop = () =>
		{
			if (that.isRecording()) $("#activityStart"+side).trigger('click');
		}
		this.setButtons = () =>
		{
			var records = activityRecords.length, time = 0, idx;
			$("#activityClose"+side).linkbutton(records ? 'enable' : 'disable');
			$("#activitySave"+side).linkbutton((!that.isRecording()) ? 'enable' : 'disable');
			$("#activityLoad"+side).linkbutton((!that.isRecording()) ? 'enable' : 'disable');
			
			var index = recordView.getIndex();
			idx = (index <= records) ? index : records;
			if ((idx == 0) || (records == 0))
			{
				$("#activityTime"+side).html("0");
				$("#activityIndex"+side).html("0 - 0");
			}
			else
			{
				var rec = activityRecords[idx-1];
				time = rec.time;
			}
			$("#activityIndex"+side).html(idx+" - "+records);
			$("#activityTime"+side).html((time/1000).toFixed(2)+" Sec");
		}
		this.isRecording = () =>
		{
			return ($('#activityStart'+side).linkbutton('options').iconCls === 'icon-stop');
		}
		this.isOn = () =>
		{
			return activityRecords.length > 0;
		}
		this.load = (records) =>
		{
			that.reset();
			activityRecords = records;
			records.forEach((o) => (activeLinks[o.channel] = true));
			var len = records.length;
			index = 0;
			recordView.fillRecordsDg();
			var elapsed = (len > 0) ? records[len-1].time : 0;
			$("#activityIndex"+side).html(index+" - "+len);
			$("#activityTime"+side).html((elapsed/1000).toFixed(2)+" Sec");
			flowView.setVisibility(false);
			recordView.setButtons();
		}
		this.getLength = () =>
		{
			return activityRecords.length;
		}
	}
	/************************ This keeps both recorder columns ********************************************/
	var Recorder = new function ()
	{
		var recorders = [], that = this, active = LEFT, isStarted = false;
		recorders[LEFT] = new recorder("L");
		recorders[RIGHT] = new recorder("R");
		this.startTest = () =>
		{
			var runs = 0;
			var code = "function testFunc() { ";
			code += "if (arg == null) return;"
			code += "info.g.runs++; ";
			console.log(testNode);
			var args = [];
			var tracPos;
			testNode.args.forEach((o) => { var argsArr = o.split(" "); args.push(argsArr[1]); });
			console.log(args);
			$("#testDiv .testTxt").each(function() {
				var txt = $(this).val();
				args.forEach((o,i) => {
					if (txt.includes(o))
					{
						tracPos = i+1;
						txt = txt.replace(o, "arg");
					}
				});
				runs++;
				code += "if (info.g.runs == "+runs+") {" + txt + "}";
				//if (txt != "") tempArray.push({ test: txt, global: that.isGlobal(txt), disabled: $(this).prop('disabled') });
			});
			if (runs == 0) return;
			code += "if (info.g.runs == "+(runs+1)+") arg = null;";
			code += "}";
			console.log(code);
			recorders[RIGHT].reset();
			var globals = recordView.getGlobals();
			globals.runs = 0;
            var test = 
            {
                type: "nano_test",
				currentTrail: testNode.currentTrail,
				filename: testNode.filename,
                code: code,//"function kaki() { info.g.runs--; if (info.g.runs <= 0 || arg == null) arg = null;  else arg.name += '***'; }",
                codeNav: "testFunc",
                tracePos: tracPos,
                globals: globals,
                test: { id: "uuid", action: 'start_autotest' }
            }
            console.log(test);
			WSSend(test);
			recordView.start("R");
			$("#activityStartR").linkbutton({iconCls: 'icon-stop'});
		}
		this.isEmpty = () =>
		{
			return (!recorders[LEFT].getLength() && !recorders[RIGHT].getLength());
		}
		this.maxLength = () =>
		{
			var left = recorders[LEFT].getLength();
			var right = recorders[RIGHT].getLength();
			i = (left > right) ? left : right;
			return i;
		}
		this.getTime = (i) =>
		{
			var left = recorders[LEFT].getLength();
			var right = recorders[RIGHT].getLength();
			var rec;
			if (left > right)
				rec = recorders[LEFT].getRecord(i);
			else
				rec = recorders[RIGHT].getRecord(i);
			return rec.delta;
		}
		this.getRecord = (who, i) =>
		{
			return recorders[who].getRecord(i);
		}
		this.load = (who, records) =>
		{
			recorders[who].load(records);
		}
		this.reset = () =>
		{
			recorders[LEFT].reset();
			recorders[RIGHT].reset();
		}
		this.setButtons = () =>
		{
			recorders[LEFT].setButtons();
			recorders[RIGHT].setButtons();
			if (that.isEmpty())
				flowView.setViewTitle("Realtime");
			else
				flowView.setViewTitle("Record");
		}
		this.isRecording = () =>
		{
			return recorders[LEFT].isRecording() || recorders[RIGHT].isRecording();
		}
		this.isOn = () =>
		{
			return recorders[LEFT].isOn() || recorders[RIGHT].isOn();
		}
		this.record = (o) =>
		{
			return recorders[active].record(o);
		}
		this.setActive = (a) =>
		{
			active = a;
		}
		this.stop = () =>
		{
			recorders[active].stop();
		}
		this.isLinkActive = (name) =>
		{
			return (recorders[LEFT].isLinkActive(name) || recorders[RIGHT].isLinkActive(name));
		}
		/*
		this.getRepeatitions = (who) =>
		{
			// for every position in the array:
			var arr = recorders[who].getRecords();
			for (var startPos = 0; startPos < arr.length; startPos++)
			{
				// check if there is a repeating sequence here:

				// check every sequence length which is lower or equal to half the
				// remaining array length: (this is important, otherwise we'll go out of bounds)
				var maxSeqLen = Math.min(6, Math.floor((arr.length - startPos) / 2));
				for (var sequenceLength = maxSeqLen; sequenceLength >= 2; sequenceLength--)
				{
					// check if the sequences of length sequenceLength which start
					// at startPos and (startPos + sequenceLength (the one
					// immediately following it)) are equal:
					var sequencesAreEqual = true;
					//console.log(sequenceLength);
					for (var i = 0; i < sequenceLength; i++)
					{
						if (arr[startPos + i].channel != arr[startPos + sequenceLength + i].channel)
						{
							sequencesAreEqual = false;
							break;
						}
					}
					if (sequencesAreEqual)
					{
						console.log("Found repeating sequence: " + (startPos+1) + "-" + (startPos+sequenceLength) + " = " + (startPos+sequenceLength+1) + "-" + (startPos + sequenceLength*2));
						startPos += sequenceLength;
					}
				}
			}
		}
		*/
		var prevLeft = null, prevRight = null;
		this.runSingle = (i) =>
		{
			var left = that.getRecord(LEFT, i-1), right = that.getRecord(RIGHT, i-1);
			if (prevLeft) flowView.highlight(prevLeft, false);
			if (prevRight) flowView.highlight(prevRight, false);
			prevLeft = prevRight = null;
			if ((left && right) && (left.channel == right.channel))
			{
				flowView.highlight(left, true, "green");
				prevLeft = left;
			}
			else
			{
				if (left)
				{
					flowView.highlight(left, true, "red");
					prevLeft = left;
				}
				if (right)
				{
					flowView.highlight(right, true, "blue");
					prevRight = right;
				}
			}
			function scrollIntoViewIfNeeded(selected)
			{
				if (!$("#displaySmartScroll").prop('checked')) return;
				selected.each(function()
				{
					var target = $(this)[0];
					var rect = target.getBoundingClientRect();
					var parent = target.parentNode.getBoundingClientRect();
					if (rect.top < parent.top)
						target.scrollIntoView(true);
					if (rect.bottom > parent.bottom)
						target.scrollIntoView(false);
				});
			}
			$(".diffContent").find(".diffSelected").removeClass("diffSelected");
			$(".diffContent").find(".diffRow"+i).addClass("diffSelected");
			scrollIntoViewIfNeeded($(".diffContent").find(".diffSelected"));
			//$(".diffContent").find(".diffRow"+(i-1)).addClass("diffSelected");
			recordView.setButtons();
		}
	}
	
	this.start = (who) =>
	{
		Recorder.setActive(who);
		var activity = NanoProject.getActivity();
		if (Object.values(activity.list).length == 0)
			$("#activityListType").val("None")
		activity.listType = $("#activityListType").val();
		var max = parseInt($("#activityMaxRecords").val());
		if (isNaN(max) || !max) max = 100000;
		$("#activityMaxRecords").val(max);
		activity.maxRecords = max;
		max = parseInt($("#activityMaxTime").val());
		if (isNaN(max) || !max) max = 1000;
		$("#activityMaxTime").val(max);
		activity.maxTime = max;
		activity.softTrigger = $("#activitySoftTriggerSelect").combobox('getText');
		activity.watchTrigger = $("#activityWatchTrigger").combobox('getText');
		activity.filters = $('#activityFilter').combobox('getText');
		NanoProject.update();
		// Load the filter
		filterData = [];
		if (activity.filters != "")
		{
			var tests = NanoProject.getTests(),
				filters = activity.filters.split(",");
			filters.forEach((name) =>
			{
				test = tests[name];
				test.records.forEach((o) => filterData[o.channel] = true);
			});
		}
		// Set buttons/inputs values
		that.reset();
		that.setButtons();
		that.buildTriggers();
		flowView.setVisibility(false);
		perf.start();
	};

    $("#activityPlay").on('click', () => {
        if (that.isRecording()) return;
		if ($("#activityPlay").linkbutton('options').disabled) return;
		if (that.isPlaying())
		{
			clearTimeout(activityTimer);
            $('#activityPlay').linkbutton({iconCls: 'icon-play'});
		}
		else
		{
			if (Recorder.isEmpty())
			{
				console.log("ActivityHandler: empty activity");
				return;
			}
            $('#activityPlay').linkbutton({iconCls: 'icon-pause'});
			this.onTimer();
		}
		that.setButtons();
    });
	$("#activityNext").on('click', () => {
		if ($('#activityNext').linkbutton('options').disabled) return;
        if (that.isRecording()) return;
		that.runSingle(1);
    });
	$("#activityReplay").on('click', () => {
		if ($('#activityReplay').linkbutton('options').disabled) return;
        if (that.isRecording()) return;
		that.runSingle(0);
    });
	$("#activityPrev").on('click', () => {
		if ($('#activityPrev').linkbutton('options').disabled) return;
        if (that.isRecording()) return;
		that.runSingle(-1);
    });
	$("#activityRestart").on('click', () => {
		//if ($('#activityPrev').linkbutton('options').disabled) return;
        if (that.isRecording()) return;
		index = 0;
		that.runSingle(0);
    });
    $("#activityGotoEnd").on('click', () => {
        if (that.isRecording()) return;
		index = Recorder.maxLength();
		that.setButtons();
    });
    
	$("#activityGotoTrigger").on('click', () => {
        if (that.isRecording()) return;
		var activity = NanoProject.getActivity();
		var len = Recorder.maxLength(), rec, channel;
		//if (Object.keys(activity.triggerStart).length == 0) return;
		for (var i = index; i < len; i++)
		{
			rec = Recorder.getRecord(LEFT, i);
			if (rec)
			{
				channel = rec.channel;
				if (rec.trigger != "")
				{
					index = i+1;
					break;
				}
				// Found in trigger list, so get out with this index
				if (activity.triggerStart[channel])
				{
					index = i+1;
					break;
				}
			}
			rec = Recorder.getRecord(RIGHT, i);;
			if (rec)
			{
				channel = rec.channel;
				if (rec.trigger != "")
				{
					index = i+1;
					break;
				}
				// Found in trigger list, so get out with this index
				if (activity.triggerStart[channel])
				{
					index = i+1;
					break;
				}
			}
		}
		that.setButtons();
	});
	// Display options
	$('#displayFilterDuplicates').change(function(e) {
		NanoDb.updateSettings("displayFilterDuplicates", $(this).prop("checked"));
		if (that.isRecording()) return;
		that.diff();
		that.filterRecords();
	});
	$('#displaySmartScroll').change(function() { NanoDb.updateSettings("displaySmartScroll", $(this).prop("checked")); });
	$('#displaySingleRow').change(function() { NanoDb.updateSettings("displaySingleRow", $(this).prop("checked")); });
	$('#displayFocusSelected').change(function() { NanoDb.updateSettings("displayFocusSelected", $(this).prop("checked")); });
	$('#displayRecordAll').change(function() { NanoDb.updateSettings("displayRecordAll", $(this).prop("checked")); });
	/************************ Compare records **************************************/
	$(".diffContent").attr("data-scrolling", "false");
	$(".diffContent").scroll(function()
	{
		// User selected to unlink scrolling
		if (!$("#displaySmartScroll").prop('checked')) return;
		// Linked so scroll both
		if ($(this).attr("data-scrolling") == "false")
		{
			$('.diffContent').not(this).attr("data-scrolling", "true");
			$('.diffContent').not(this).scrollTop($(this).scrollTop());
		}
		$(this).attr("data-scrolling", "false");
	});
	$(".diffRow").live('click', function ()
	{
		var i = $(this).data("index"), side = $(this).data("side"), skipOpen = false;
		recordView.runTo(i);
		var singleRow = $("#displaySingleRow").prop('checked');
		// If tree already opened for this row, close it.
		var next = $(this).next();
		if ($(next).hasClass('argumentsTree'))
		{
			$(next).fancytree("destroy");
			$(next).remove();
			skipOpen = true;
		}
		// Close other trees if only single row is enabled
		if (singleRow)
		{
			$(this).parent().find(".argumentsTree").each(function (index) {
				$(this).fancytree("destroy");
				$(this).remove();
			});
		}
		
		// This row was already opened so dont open again.
		if (skipOpen) return;
		// Open new arguments tree
		var temp = (side == LEFT) ? Recorder.getRecord(LEFT, i-1) : Recorder.getRecord(RIGHT, i-1);
		if (temp)
		{
			$("#testTitle").html(temp.name);
			if (testNode && (testNode.channel != temp.channel)) $("#testDiv").empty();
			$('#recTabs').tabs('select', 'Test');
			codeEditor.getMethod(temp.channel);
			var tree = makeTree(temp);
			tree.setOption("activate", function(event, data) {
				var node = data.node;
				if (node.folder) return;
				if (node.getLevel() > 3) return;
				testNode = temp;
				$.messager.prompt('New Value', 'Please enter new value for '+node.key+':', function(r){
					if (r)
					{
						var p = node;
						var txt = "";// node.key;
						while (p.getLevel() > 1)
						{
							var key = p.key;
							if (key.includes(" "))
							{
								var arr = key.split(" ");
								key = arr[1];
							}
							txt = key + "." + txt;
							p = p.getParent();
							//txt = p.key+"."+txt;
						}
						txt = txt.slice(0, -1);
						var title = txt;
						txt += " = " + r + ";";
						var div = $("<div class='testRow'>").html("<textarea class='testTxt'>"+txt+"</textarea>");
						//div.children(".testTxt").prop('disabled', disabled);
						$('#testDiv').append(div);
						div.panel({
							width:400,
							height:80,
							title: title,
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
				});
				var defValue = node.data.value;
				if (isNaN(defValue)) defValue = "\"" + defValue + "\"";
				$('.messager-input').val(defValue).focus();
			});
			$(tree.$div).insertAfter($(this));
			if ($("#displayFocusSelected").prop('checked'))
				flowView.focus(temp.channel);
		}
	});
	/********************************************************************************/
	this.startTest = () =>
	{
		console.log("Starting test");
		Recorder.startTest();
	}
	this.diff = () =>
	{
		// Clear
		$('.diffContent').empty();
		var len = Recorder.maxLength(), left, right, color = "black";
		var filterDuplicates = $("#displayFilterDuplicates").prop('checked'), leftChannels = {}, rightChannels = {};
		for (var i = 0; i < len; i++)
		{
			left = Recorder.getRecord(LEFT, i);
			right = Recorder.getRecord(RIGHT, i);
			rowIndex = i+1;
			if (left && right) color = (left.channel == right.channel) ? "#007b00" : "#aa0000";
			if (left && (!filterDuplicates || !leftChannels[left.channel]))
			{
				var src = left.source,
					tgt = left.target,
					srcNode = flowView.findNode(left.srcHash),
					tgtNode = flowView.findNode(left.tgtHash),
					srcColor = srcNode ? srcNode.color : '#FFFFFF',
					tgtColor = tgtNode ? tgtNode.color : '#FFFFFF';
				var div = $('<div class="diffRow diffRow'+rowIndex+'"></div>').appendTo('#diffLeft');
				div.data("channel", left.channel);
				div.data("index", rowIndex);
				div.data("side", LEFT);
				div.css('color', color);
				$('<div class="diffNum">'+rowIndex+'</div>').appendTo(div);
				$('<div class="diffSrc" style="background-color:'+convertHex(srcColor,10)+';">'+src+'</div>').appendTo(div);
				$('<div class="diffMtd">'+left.name+'</div>').appendTo(div);
				$('<div class="diffTgt" style="background-color:'+convertHex(tgtColor,10)+';">'+tgt+'</div>').appendTo(div);
				leftChannels[left.channel] = true;
			}
			if (right && (!filterDuplicates || !rightChannels[right.channel]))
			{
				var src = right.source,
					tgt = right.target,
					srcNode = flowView.findNode(right.srcHash),
					tgtNode = flowView.findNode(right.tgtHash),
					srcColor = srcNode ? srcNode.color : 'red',
					tgtColor = tgtNode ? tgtNode.color : 'red';
				var div = $('<div class="diffRow diffRow'+rowIndex+'"></div>').appendTo('#diffRight');
				div.data("channel", right.channel);
				div.data("index", rowIndex);
				div.data("side", RIGHT);
				div.css('color', color);
				$('<div class="diffNum">'+rowIndex+'</div>').appendTo(div);
				$('<div class="diffSrc" style="background-color:'+convertHex(srcColor,10)+';">'+src+'</div>').appendTo(div);
				$('<div class="diffMtd">'+right.name+'</div>').appendTo(div);
				$('<div class="diffTgt" style="background-color:'+convertHex(tgtColor,10)+';">'+tgt+'</div>').appendTo(div);
				rightChannels[right.channel] = true;
			}
		}
		$('.diffContent').scrollTop(0);
	}
	this.filterRecords = () =>
	{
		var txt = $('#recordsSearch').val().trim().toLowerCase(), exactMatch = false;
		// Remove all arguments trees
		$(".diffContent").find(".argumentsTree").each(function (index) {
			$(this).fancytree("destroy");
			$(this).remove();
		});
        // Search for exact match?
        if(txt[0] == '"' && txt[txt.length - 1] == '"')
        {
            exactMatch = true;
            txt = txt.replace(/['"]+/g, "");
		}
		// Perform the filtering
		$(".diffMtd").each(function()
		{
			var val = $(this).html().toLowerCase(),
				row =$(this).parent();
			if ((exactMatch && val === txt) || (!exactMatch && val.includes(txt)))
				row.show();
			else
				row.hide();
		});
	}
    this.buildTests = () =>
    {
		var filters =[], activeFilters = [];
        if (NanoProject.getProject())
        {
            var tests = NanoProject.getTests();
			var activity = NanoProject.getActivity();
			
            testsDgData = [];
            Object.keys(tests).forEach((o) =>
            {
                var rec = tests[o];
                if (!rec.records) return;
                testsDgData.push({name: rec.name, date: rec.date, length: rec.records.length});
				filters.push({id: o, text: o});
				if (activity.filters.includes(o)) activeFilters.push(o);
            });
        }
        else
        {
            testsDgData = [];
        }
        $('#testsDg').datagrid('loadData', testsDgData);
		$('#activityFilter').combobox('loadData',filters);
		$('#activityFilter').combobox('setValues',activeFilters);
    }
    this.deleteTest = () =>
    {
        var row = $('#testsDg').datagrid('getSelected');
        console.log(row);
		if (row)
        {
            $.messager.confirm('Delete Test', 'Are you sure you want to delete this test ?', function(r){
				if (r) {
					var tests = NanoProject.getTests();
                    delete tests[row.name];
                    NanoProject.update();
                    that.buildTests();
				}
			});
        }
    }
    this.fillRecordsDg = () =>
    {
		recordView.diff();
    }
	this.getIndex = () =>
	{
		return index;
	}
	this.addToGlobals = (key, val) =>
	{
		if (!key || !val) return;
		var theTree = $.ui.fancytree.getTree($("#globalsTree"));
		var node = theTree.getNodeByKey(key);
		if (node)
		{
			node.remove();
		}
		node = theTree.getNodeByKey("Globals");
		addToTree(val, node, key, false);
	}
	this.delFromGlobals = (key) =>
	{
		var theTree = $.ui.fancytree.getTree($("#globalsTree"));
		var node = theTree.getNodeByKey(key);
		if (node) node.remove();
	}
	this.buildGlobals = (g) =>
	{
		if (!g) g = {};
		var theTree = $.ui.fancytree.getTree($("#globalsTree"));
		theTree.clear();
		root = theTree.getRootNode();
		addToTree(g, root, "Globals", true);
	}
	this.getGlobals = () =>
	{
		var theTree = $.ui.fancytree.getTree($("#globalsTree"));
		var node = theTree.getNodeByKey("Globals");
		var globals = {};
		if (node && node.hasChildren())
		{
			var children = node.getChildren();
			children.forEach((o) => {
				globals[o.key] = o.data.value;
			});
		}
		console.log(globals);
		return globals;
	}
	this.onTest = (o) =>
	{
		console.log(o);
		if (o.test && o.test.action == 'stop')
		{
			isStarted = false;
			Recorder.stop();
			that.buildGlobals(o.globals);
		}
	}
    this.loadTest = () =>
    {
        var row = $('#testsDg').datagrid('getSelected');
		if (row)
        {
			var tests = NanoProject.getTests(),
				test = tests[row.name];
			var to = $("#testsDlg").data("to");
			Recorder.load(to, test.records);
			$("#testsDlg").dialog("close");
        }
    }
    this.buildTriggers = () =>
    {
		var activity = NanoProject.getActivity();
		function remove(e)
		{
			var target = $(e.target), type = target.data('type'), key = target.data('key');
			delete activity[type][key];
			NanoProject.update(); that.buildTriggers();
		}
		function build(e, type)
		{
			e.html("");
            if (activity)
            {
                var list = activity[type];
                for (var key in list)
                {
                    var title = list[key];
                    if (type == "pipes")
                    {
                        var alias = NanoProject.pipeAlias(key);
                        if (alias) title = alias;
                    }
                    var span = $('<span class="tagbox-label '+key+'" tagbox-index="0" style="height: 20px; line-height: 20px; ">').html(title+'<span data-type='+type+' data-key='+key+' class="tagbox-remove"></span>');
                    span.find(".tagbox-remove").on('click', (e) => remove(e) );
                    e.append(span);
                }
            }
			if ( e.children().length == 0) e.html("None");
		}
		build($("#activityStartTrigger"), "triggerStart");
		build($("#activityStopTrigger"), "triggerStop");
		build($("#activityList"), "list");
		build($("#activityPipes"), "pipes");

		var softTrigs =[], startTrigs = [], watchTrigs=[];
        if (activity)
        {
            var triggers = NanoProject.getSoftTriggers();
            for (var i=0;i<triggers.length;i++)
            {
                softTrigs.push({id: i, text: triggers[i]});
                if (activity.softTrigger.includes(triggers[i])) startTrigs.push(i);
                if (activity.watchTrigger.includes(triggers[i])) watchTrigs.push(i);
            }
        }
		$('#activitySoftTriggerSelect').combobox('loadData',softTrigs);
		$('#activitySoftTriggerSelect').combobox('setValues',startTrigs);
		$('#activityWatchTrigger').combobox('loadData',softTrigs);
		$('#activityWatchTrigger').combobox('setValues',watchTrigs);
    }
	this.init = function(p)
	{
		that.reset();
		that.buildGlobals({});
		Recorder.reset();
		$("#activityAddStartTrigger").linkbutton(p ? 'enable' : 'disable');
		that.setButtons();
        if (p)
        {
            $("#activityListType").val(p.data.activity.listType);
			$("#activityMaxRecords").val(p.data.activity.maxRecords);
            $("#activityMaxTime").val(p.data.activity.maxTime);
        }
        that.buildTests();
        that.buildTriggers();
	}
    this.reset = () =>
    {
		//that.fillRecordsDg();
        index = 0;
        triggered = false;
    }
	this.setButtons = function()
	{
		var records = Recorder.maxLength();
		if (records == 0) index = 0;
		var started = (index != 0);
			running = that.isPlaying(),
			legalIndex = (index <= records) && (records != 0);
		$("#activityNext").linkbutton(((index < records) && !running) ? 'enable' : 'disable');
		$("#activityReplay").linkbutton((started && !running) ? 'enable' : 'disable');
		$('#activityPlay').linkbutton((!that.isRecording() && legalIndex) ? 'enable' : 'disable');
		$("#activityPrev").linkbutton(((index > 1) && !running) ? 'enable' : 'disable');
		$("#activityRestart").linkbutton((started && !running) ? 'enable' : 'disable');
        $("#activityGotoEnd").linkbutton((records && !running && (index != records)) ? 'enable' : 'disable');
		$("#activityGotoTrigger").linkbutton(((index < records) && !running) ? 'enable' : 'disable');
        $("#activityStartTrigger").prop('disabled', that.isRecording());
        $("#activityStopTrigger").prop('disabled', that.isRecording());
		$("#activityMaxRecords").prop('disabled', that.isRecording());
        $("#activityMaxTime").prop('disabled', that.isRecording());
		$("#activityFilter").combobox(!that.isRecording() ? 'enable':'disable');
		$("#activitySoftTriggerSelect").combobox(!that.isRecording() ? 'enable':'disable');
		$("#activityWatchTrigger").combobox(!that.isRecording() ? 'enable':'disable');
		Recorder.setButtons();
	}
	this.trigger = function(o)
	{
		if (!triggered)
		{
		}
	}
	this.record = function(o)
	{
		if (filterData[o.channel] === true) return;

        var activity = NanoProject.getActivity(),
			softTrigger = $("#activitySoftTriggerSelect").combobox('getText');
		// Trigger if no triggers at all
		if (!triggered && (softTrigger == "") && (Object.keys(activity.triggerStart).length == 0))
        {
            triggered = true;
		}
		// Trigger if we got a channel trigger
        if (!triggered && activity.triggerStart[o.channel])
        {
            $('#activityStartTrigger').find('.tagbox-label.'+o.channel).css('color', 'blue');
            triggered = true;
        }
        // Trigger if we got a channel trigger
		if (!triggered && o.trigger && softTrigger.includes(o.trigger))
        {
			// TODO
			//$("#activitySoftTriggerSelect").combobox('background-color','#bbccee');
            triggered = true;
        }
		// Already triggered
        if (triggered)
        {
			// Black/white list
            var listType = $("#activityListType").val(), doRecord;
            if (listType == "None")
            {
                doRecord = true;
            }
            else if (listType == "White")
            {
                doRecord = (activity.list[o.channel] != undefined);
                 $('#activityList').find('.tagbox-label.'+o.channel).css('color', 'green');
            }
            else if (listType == "Black")
            {
                doRecord = !(activity.list[o.channel] != undefined);
                $('#activityList').find('.tagbox-label.'+o.channel).css('color', 'red');
            }
			// Do not record if not in pipes list
			if (doRecord && Object.keys(activity.pipes).length)
			{
				if (activity.pipes[o.pipe] == undefined) doRecord = false;
				else $('#activityPipes').find('.tagbox-label.'+o.pipe).css('color', 'blue');
			}
			// Do not record if not in watch list
			var watchTrigger = $("#activityWatchTrigger").combobox('getText');
			if (doRecord && watchTrigger && (!o.trigger || !watchTrigger.includes(o.trigger)))
			{
				doRecord = false;
			}
			// Perform the record
            if (doRecord)
            {
                // Push the record into the activity records
				var len = Recorder.record({
					channel: o.channel,
					source: o.source,
					target: o.target,
					args: o.args,
					argValues: o.argValues,
					currentTrail: o.currentTrail,
					filename: o.filename,
					srcHash: o.srcHash,
					tgtHash: o.tgtHash,
					//globals: o.globals,
					//contexts: o.contexts,
					//periodics: o.periodics,
					name: o.name,
					pipe: o.pipe,
					trigger: o.trigger,
					time: perf.elapsed(),
					delta: perf.lap()});
				// Stop if reached maximum number of records
				if (len >= activity.maxRecords)
				{
					Recorder.stop();
				}
            }
			// Stop if in stop trigger list
			if (activity.triggerStop[o.channel])
			{
				$('#activityStopTrigger').find('.tagbox-label.'+o.channel).css('color', 'blue');
				Recorder.stop();
			}
        }
	}
	this.isLinkActive = function(name)
	{
		if (that.isViewOn())
        {
            return (Recorder.isLinkActive(name));
        }
		return true;
	}
	this.isViewOn = function()
	{
		return Recorder.isOn();
	}
	this.isRecording = () =>
	{
		return Recorder.isRecording();
	}
    this.isPlaying = () =>
	{
        return ($('#activityPlay').linkbutton('options').iconCls === 'icon-pause');
	}
	this.runTo = function(i)
	{
		index = i;
		Recorder.runSingle(index);
	}
	this.runSingle = function(forward)
	{
		index += forward;
		if (index < 1) index = 1;
		Recorder.runSingle(index);
	}
    this.onTimer = function()
    {
		var len = Recorder.maxLength();
		// Check if we have anything to run or recorder is at the end.
		if (index < len) that.runSingle(1);
		// Check index after the single run and see if playing should be stopped.
        if (index >= len)
        {
            console.log("ActivityHandler: finished!");
			$("#activityPlay").trigger('click');
            return;
        }
		//var time = recorders[longest].getRecord(index).delta;
		var time = Recorder.getTime(index);
        activityTimer = setTimeout(that.onTimer, time);
    }
}