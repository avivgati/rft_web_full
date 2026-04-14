function MxDraw(container) {
    var that = this, focusedLink = null, currentView = true,
        graph, parent, layout,
        nodes = {}, links = {}, dummyLinks = [], loadDone = false;

    var history = new UndoRedo();
    var colors  = new ColorBank();

    // Configuration
    var dotSpeed = 0.5, // Dot speed
        highlightTarget = false, // Highlight the target border when message arrives
        graphAnimation = false, // Show graph animation when changing view. High performence.
        showNodeDetailsAsPopup = false, // Show the node details as popup or in the east view
        wrap = true, // Wrap text (true), or truncate to fit size (false)
        colorEdges = false,
        highlightOnMouseOver = false, // Highlight branch on mouse over cell (edge - highlight source/target, vertex - highlight all edges)
		createDummyNodes = true, // Create dummy nodes for east edges (to make the flow go west only)
		executeOnViewChange = true, // Execute the layout when view changes
        removeScaleAndTranslateListeners = false; // Remove some listeners for better graph performence (causes some quirky stuff)

    // History navigation buttons
    $("#mxBack").on('click', () => that.back());
    $("#mxForward").on('click', () => that.forward());
    $("#mxHome").on('click', () => that.home());

    that.findNode = (name) =>
	{
		return nodes[name];
    }
    that.findLink = (name) =>
	{
		return links[name];
	}
    that.findMethod = function(pan)
    {
        // Get the current working cell
        var cell = history.get();
        that.setVisibility(true);
        if (pan) graph.fit(50,null,null,null,null,null,0.9);
    }
    var regExpEscape = function (s) {
        return s.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
    };
	that.setVisibility = function(skipLayout)
    {
		graph.clearSelection();
        var txt = $('#findMethod').val().trim().toLowerCase(), exactMatch = false, needLayout = false;
        if(txt[0] == '"' && txt[txt.length - 1] == '"')
        {
            exactMatch = true;
            txt = txt.replace(/['"]+/g, "");
        }
        function checkMatch(txt2)
        {
            txt2 = txt2.toLowerCase();
            return (exactMatch) ? (txt2 === txt) : txt2.includes(txt);
        }
        console.log("set Visibility: needLayout="+needLayout);
		// Make all nodes hidden. The links loop will show if needed.
		for (var key in nodes)
        {
            var node = nodes[key];
			node.visible = false;
		}
        for (var key in links)
        {
            var link = links[key],
                show = false;
            if (link.inView)
            {
                var title = link.title,
                    active = recordView.isLinkActive(link.name), src = link.origSrc, tgt = link.origTgt;
                if (txt != "")
                {
                    // Link match?
                    if (checkMatch(title) || checkMatch(src.name) || checkMatch(tgt.name))
                    {
                        link.value = title.replace(RegExp(regExpEscape(txt), "gi"), "<mark>$&</mark>");
						src.value = src.name.replace(RegExp(regExpEscape(txt), "gi"), "<mark>$&</mark>");
						tgt.value = tgt.name.replace(RegExp(regExpEscape(txt), "gi"), "<mark>$&</mark>");
                        show = active;
                    }
                    else
                    {
                        link.value = title;
						//src.value = src.name;
						//tgt.value = tgt.name;
                    }
                }
                else
                {
                    link.value = title;
					src.value = src.name;
					tgt.value = tgt.name;
                    show = active;
                }
                // If link changed to visible and it need layout - force graph layout
                if (!link.visible && show && link.needLayout)
                {
                    needLayout = true;
                    link.needLayout = false;
                }
            }
			if (show)
			{
				src.visible = true;
				src.getParent().visible = true;
				tgt.visible = true;
				tgt.getParent().visible = true;
				if (src.needLayout)
				{
					needLayout = true;
					src.needLayout = false;
				}
				if (tgt.needLayout)
				{
					needLayout = true;
					tgt.needLayout = false;
				}
			}
            link.visible = show;
        }
/*
        // If node has no edges, hide it
        for (var key in nodes)
        {
            var node = nodes[key], name = node.name, show = false, visibleLinks = false,
				count = node.getEdgeCount();
            if (graph.isSwimlane(node.getParent()))
            {
                visibleLinks = true;
            }
            else
            {
                for (i = 0; i < count; i++)
                {
                    var edge = node.getEdgeAt(i);
                    if (edge.visible)
                    {
                        visibleLinks = true;
                        break;
                    }
                }
            }
            // Show the node if it matches the search
            if ((txt != "") && name.toLowerCase().includes(txt) && visibleLinks)
            {
                node.value = name.replace(RegExp(regExpEscape(txt), "gi"), "<mark>$&</mark>");
                show = true;
            }
            else
            {
                node.value = node.name;
                show = visibleLinks;
            }
            // If node changed to visible and it need layout - force graph layout
            if (!node.visible && show && node.needLayout)
            {
                needLayout = true;
                node.needLayout = false;
            }
            node.visible = show;
        }
*/
		var fit = false, nodesToLayout = [];
		if (executeOnViewChange && (!skipLayout || needLayout))
		{
            needLayout = true;
            // Fit to view only on full view
            fit = (typeof currentView == "boolean") ? currentView : true;
            // Decide what needs layout
			for (var key in nodes)
			{
				var node = nodes[key];
				if (node.visible)
				{
					if (graph.isSwimlane(node))
					{
						nodesToLayout.push(node);
					}
					else
					{
						that.setCellSize(node);
					}
				}
			}
		}
        // Perform layout or just refresh for visibility
		if (needLayout)
		{
			// Layout the groups first
			nodesToLayout.forEach((node) => {
                stackLayout.roots = null;
				stackLayout.execute(node);
			});
			// Main layout
			that.executeLayout(fit);
		}
		else graph.refresh();
		
    }
    that.findPipe = function(done)
    {
        var cells = [];
        var txt = $('#findPipe').val();
        if (txt != "")
        {
            txt = txt.toLowerCase();
            if (done) txt = "|"+txt+"|";
            for (var key in links)
            {
                var link = links[key],
					pipe = NanoProject.getPipeAlias(link.name);
                if (done) pipe = "|"+pipe+"|";
                if (pipe.toLowerCase().includes(txt))
                {
                    cells.push(link.source);
                    cells.push(link.target);
                    cells.push(link);
                }
            }
        }
        var allCells = Object.values(nodes);
        if (cells.length == 0)
        {
            graph.toggleCells(true, allCells, true);
        }
        else
        {
            graph.toggleCells(false, allCells, true);
            graph.toggleCells(true, cells);
        }
        that.executeLayout();
    }
	/////////////////////////////////// Grouping //////////////////////////////////////
	var getHighestCell = (cell, parent) =>
	{
		var p = cell.getParent();
		if (p == parent) return cell;
		return getHighestCell(p, parent);
	}
	/*
	var executeRecurse = (cell) =>
	{
		console.log("Executing:",cell);
		stackLayout.roots = null;
        stackLayout.execute(cell);
		var p = cell.getParent();
		if (p == parent) return;
		if (graph.isSwimlane(p))
			executeRecurse(p);
	}
	*/
    that.groupCells = (name, cells, fold) =>
    {
        //if (cells.length < 2) return;
        if (nodes[name]) return;
        var data = [];
        var common = [],
            groupParent = cells[0].getParent(),
            group = graph.insertVertex(groupParent, null, name, 0, 0, 200, 280, 'swimlane;');
		group.name = name;
        cells.forEach((cell)=>
        {
            data.push(cell.hash);
			var edges = cell.edges.slice();
            edges.forEach((edge)=>
            {
                if (common.includes(edge)) return;
                if (cells.includes(edge.source) && cells.includes(edge.target))
                {
                    common.push(edge);
                    return;
                }
                if (edge.source == cell)
                {
					graph.connectCell(edge, group, true);
                }
                if (edge.target == cell)
                {
					graph.connectCell(edge, group, false);
                }
            });
        });
        // Group the cells
        graph.groupCells(group, 10, [...cells, ...common]);
        // Layout inside the group
        stackLayout.roots = null;
        stackLayout.execute(group);
        // Fold the cell
		if (fold) graph.foldCells(true, false, [group]);
		nodes[name] = group;
        return data;
    }
	that.removeGroups = () =>
	{
		if (NanoProject.getProject())
        {
            var groups = NanoProject.getGroups(), cell;
            for (var name in groups)
            {
				cell = nodes[name];
                if (cell)
                {
					that.ungroupCells(cell);
                }
            }
        }
	}
    that.applyGroups = () =>
    {
        if (NanoProject.getProject())
        {
            var groups = NanoProject.getGroups(), cells;
            for (var name in groups)
            {
                cells = [];
                if (groups[name])
                {
                    groups[name].forEach((cell) =>
                    {
                        var c = nodes[cell];
                        cells.push(c);
                    });
                    that.groupCells(name, cells, true);
                }
            }
        }
    }
    
    that.group = (name) =>
    {
        var cells = graph.getSelectionCells();
        var data = that.groupCells(name, cells, true);
        // Save in project
        NanoProject.addGroup(name, data);
    }
    that.ungroupCells = (cell) =>
    {
        var name = cell.name,
            groupParent = cell.getParent();
        if (cell.edges)
        {
			var edges = cell.edges.slice();
			edges.forEach((edge)=>
            {
				if (edge.source == cell)
				{
					var p = getHighestCell(edge.origSrc, cell);
					graph.connectCell(edge, p, true);
				}
				if (edge.target == cell)
				{
					var p = getHighestCell(edge.origTgt, cell);
					graph.connectCell(edge, p, false);
				}
			});
        }
        graph.ungroupCells([cell]);
        if (graph.isSwimlane(groupParent))
        {
            stackLayout.roots = null;
            stackLayout.execute(groupParent);
        }
        
        delete nodes[name];
    }
    that.ungroup = (cell) =>
    {
        that.ungroupCells(cell);
        NanoProject.removeGroup(cell.name);
        that.executeLayout();
    }
    that.addToGroup = (cell, group) =>
    {
        var fold = group.isCollapsed();
        var groups = NanoProject.getGroups(), cells = [];
        groups[group.name].forEach((c) =>
        {
            cells.push(nodes[c]);
        });
        that.ungroupCells(group);
        var data = that.groupCells(group.name, [...cells, cell], fold);
        that.executeLayout();
        // Save in project
        NanoProject.addGroup(group.name, data);
    }
    that.removeFromGroup = (cell) =>
    {
        var group = cell.getParent(), name = group.name;
        var fold = group.isCollapsed();
        var groups = NanoProject.getGroups(), cells = [];
        groups[name].forEach((c) =>
        {
            if (c != cell.hash)
                cells.push(nodes[c]);
        });
        that.ungroupCells(group);
        var data = groupCells(name, cells, fold);
        if (data)
            NanoProject.addGroup(name, data);
        else
            NanoProject.removeGroup(name);
        that.executeLayout();
    }
    that.renameGroup = (group, name) =>
    {
        var oldName = group.name;
        // Change in the DB
        NanoProject.renameGroup(oldName, name);
        // Change the cell name and label
        graph.cellLabelChanged(group, name);
        group.name = name;
        // Update the nodes list
        nodes[name] = group;
        delete nodes[oldName];
    }
	var packages = [];
	var packageViewOn = false;
	that.packageView = (show) =>
	{
		$("#loading_fade").show();
		setTimeout(function() 
		{
			$('#findMethod').val("");
			if (!show && packageViewOn)
			{
				// Remove the package groups
				packages.forEach((pkg) => {
					if (nodes[pkg])
						that.ungroupCells(nodes[pkg]);
					else
						console.log("No pkg:"+pkg);
				});
				packages = [];
				packageViewOn = false;
				// Apply back the user groups
				that.applyGroups();
				//that.executeLayout();
			}
			else if (show && !packageViewOn)
			{
				// Remove the user groups first
				that.removeGroups();
				// Group by packages
				var groups = {};
				for (var key in nodes)
				{
					var node = nodes[key];
					if (node.pkg)
					{
						var name = node.pkg;
						if (!groups[name]) groups[name] = [];
						groups[name].push(node);
					}
				}
				Object.keys(groups).forEach((key) => {
					var group = groups[key];
					// Create a group and push to packages array if created
					if (that.groupCells(key, group, false) != undefined)
						packages.push(key);
				});
				packageViewOn = true;
            }
            that.setVisibility();
			that.executeLayout();
			setTimeout(function() { $("#loading_fade").hide(); }, 20);
		}, 10);
		
	}
	////////////////////////////////////////////////////////////////////////////////
	var debug_is_on = false;
    that.debug = function(txt)
    {
		layout.roots = null;
		layout.execute(parent);
    }
    that.setCellOpacity = (op) =>
    {
        style = graph.getStylesheet().getDefaultVertexStyle();
        style[mxConstants.STYLE_FILL_OPACITY] = op;
        graph.refresh();
    }
    that.setHighlightCells = (h) =>
    {
        highlightOnMouseOver = h;
    }
	that.setCombineEdges = (c) =>
    {
		//if (NanoProject.getProject() && (combineEdges != c))
		//	NanoProject.close();
        combineEdges = c;
    }
    that.changeStyle = (cell, styles) =>
    {
        var style = cell.getStyle();
        styles.forEach(s =>
        {
            style = mxUtils.setStyle(style, s.key, s.value);
        });
        graph.model.setStyle(cell, style);
    }
	that.highlight = (o, set, clr) =>
	{
        if (!loadDone) return;
        var style = graph.getStylesheet().getDefaultEdgeStyle();
        var def = style[mxConstants.STYLE_FILL_OPACITY];
		var color = set?'red':'#6482B9',
			opacity = set?80:def;
		if (clr != undefined) color = clr;
        that.changeStyle(links[o.channel], [{key: 'strokeColor', value: color},{key:'opacity',value:opacity}]);
        that.changeStyle(nodes[o.srcHash], [{key: 'strokeColor', value: color}]);
        that.changeStyle(nodes[o.tgtHash], [{key: 'strokeColor', value: color}]);
	}
    that.highlightBranch = (cell, set) =>
    {
        var color = set?'red':'#6482B9';
        if (cell.isVertex())
        {
            var count = cell.getEdgeCount();
            for (i = 0; i < count; i++)
            {
                var edge = cell.getEdgeAt(i);
                if (edge.visible)
                {
                    that.changeStyle(edge, [{key: 'strokeColor', value: color}]);
                }
            }
        }
        else
        {
            that.changeStyle(cell.source, [{key: 'strokeColor', value: color}]);
            that.changeStyle(cell.target, [{key: 'strokeColor', value: color}]);
        }
        that.changeStyle(cell, [{key: 'strokeColor', value: color}]);
    }
    that.setEdgeColor = function(channel, color, w)
    {
        var link = links[channel];
        if (!link) return;
		var	style = link.getStyle();
        style = mxUtils.setStyle(style, 'strokeColor', color);
        graph.model.setStyle(link, style);
    }
	that.setNodeColor = function(name, color)
    {
        var node = nodes[name];
        var style = mxUtils.setStyle(node.getStyle(), 'strokeColor', color);
        graph.model.setStyle(node, style);
    }
    that.update = function(edge)
    {
        var channel = edge.channel;
        that.setMute(channel, edge.mute);
        that.setEdgeColor(channel, (NanoProject.checks(channel))?'green':null);
    }
    that.setMute = function(channel, mute)
    {
        var link = links[channel];
        var style = mxUtils.setStyle(graph.model.getStyle(link), 'startArrow', mute?'mute':'');
        graph.model.setStyle(link, style);
    }
    that.home = function()
    {
        history.clear();
        $('#findMethod').val("");
        that.changeView(true);
    }
    that.back = function()
    {
        var cell = history.undo();
        that.changeView(cell);
    }
    that.forward = function()
    {
        var cell = history.redo();
        if (cell)
        {
            that.changeView(cell);
        }
    }
    that.resetViewTitle = () =>
    {
        $('#viewType').html("Main View");
        $("#focusType").html("");
    }
    that.setViewTitle = (type) =>
    {
        $('#viewType').html(type);
    }
    that.setFocusType = (type) =>
    {
        $("#focusType").html(type);
    }
    that.changeView = function(c)
    {
		if ((c == null) || (c == undefined)) c = true;
        //Back/forward buttons state
        $("#mxBack").linkbutton(history.canUndo()?'enable':'disable');
        $("#mxForward").linkbutton(history.canRedo()?'enable':'disable');
        // Set the visibility
        currentView = c;
		if (typeof c == "boolean")
		{
            if (c) that.setFocusType("None");
			for (var key in links) links[key].inView = c;
			that.setVisibility();
		}
		else
		{
			if (c.isEdge())
			{
                if (NanoDb.getSettings().aiEnabled)
                {
                    var o = NanoProject.getChannel(c.name);
                    if ($('#mainTabs').tabs('exists', o.name))
                    {
                        $('#mainTabs').tabs('select', o.name);
                    }
                    else
                    {
                        var msg = { type: "nano_branch", channel: o.name, source: o.source, target: o.target, filename: o.filename, pipe: o.pipe };
                        console.log(msg);
                        WSSend(msg);
                    }
                }
                else
                {
                    // Set the title
                    that.setFocusType(currentView.title+" (Method)");
                    for (var key in links) { var link = links[key]; link.inView = ((link.source == c.source) || (link.target == c.target)); }
                    that.setVisibility();
                }
			}
			else
			{
                if (graph.isSwimlane(c))
                {
                    that.setFocusType(c.name+" (Package)");
                    for (var key in links)
                    {
                        var link = links[key];
                        link.inView = (link.source == c) || (link.target == c) || (link.getParent() == c);
                    }
                    packages.forEach((pkg) =>
                    {
                        var cell = nodes[pkg];
                        if (!cell) return;
                        graph.foldCells(cell!=c, false, [cell]);
                    });
                }
                else
                {
                    that.setFocusType(c.name+" (Class)");
                    for (var key in links) { var link = links[key]; link.inView = ((link.source == c) || (link.target == c) || (link.origSrc == c) || (link.origTgt == c)); }
                }
				if(createDummyNodes)
				{
					var dummy = nodes[c.name+"Dummy"];
					if (dummy == c) dummy = nodes[c.name];
					if (dummy)
					{
						for (var key in links)
						{
							var link = links[key];
							link.inView |= /*link.visible && */((link.source == dummy) || (link.target == dummy));
						}
					}
				}
				that.setVisibility();
			}
		}
    }
    that.executeLayout = $.throttle(function(fit)
    {
		if (!loadDone) return;
        console.log("execute Layout");
        //graph.model.setEventsEnabled(false);
        graph.getModel().beginUpdate();
        try
        {
            layout.roots = null;
            layout.execute(parent);
        }
        catch (e)
        {
            throw e;
        }
        finally
        {
            graph.getModel().endUpdate();
            //graph.model.setEventsEnabled(true);
			if (fit) graph.fit(50,null,null,null,null,null,0.9);
        }
    }, 1000);
    that.setDashed = function()
    {
        for (var key in links)
        {
            var link = links[key];
            //console.log(link.name);
            //console.log(graph.view.getState(link));
            if (link.visible)
            {
                var dashed = (link.source.geometry.x > link.target.geometry.x)?1:0;
                var model = graph.model;
                //var oldDashed = model.getStyle(link);
                //var d = mxUtils.indexOfStylename(oldDashed, 'dashed');
                //console.log(oldDashed);
                var style = mxUtils.setStyle(model.getStyle(link), 'dashed', dashed);
                model.setStyle(link, style);
            }
        }
    }
	/*
    that.addOverlay = function(cell)
    {
        // Creates a new overlay with an image and a tooltip
        var overlay = new mxCellOverlay(new mxImage('images/configure.png', 16, 16), 'Add outgoing', mxConstants.ALIGN_RIGHT, mxConstants.ALIGN_TOP, new mxPoint(-10,10));
        overlay.cursor = 'help';

        // Installs a handler for clicks on the overlay							
        overlay.addListener(mxEvent.CLICK, function(sender, e)
        {
            var cell = e.getProperty('cell');
            $("#dialog").dialog({ title: "Node \"" + cell.name + "\"" });
            $("#dlgContent").html("TODO");
			$("#dialog").dialog( "open" );
        });

        // Sets the overlay for the cell in the graph
        graph.addCellOverlay(cell, overlay);
    }
	*/
    that.alert = function(channel, on)
    {
        var link = links[channel];
        //graph.removeCellOverlays(link);
        graph.setCellWarning(link, 'Tooltip');
    }
    that.msg = function(o)
    {
        var channel = o.channel;
        var link = links[channel];
        if (link)
        {
            //var goEast = (link.source.geometry.x < link.target.geometry.x) ? true : false;
            // No need for too many balls on the link
            if (link.ballTime && ((Date.now() - link.ballTime) < 200)) return;
            // Check if this channel is in the model view and update the message.
            //var l = $("#popupContent div[name='"+link.name+"']");
            //if (l.length > 0) l.html(msg);
            // Add a circle
            var state = graph.view.getState(link);
            if (state)
            {
                //var innerPath = state.shape.node.getElementsByTagName('path')[0];
                var outerPath = state.shape.node.getElementsByTagName('path')[1],
                    color = colors.getFromString(o.pipe),//v2.color; link.color,//link.origTgt.color,
                    path = d3.select(outerPath),
                    svg = d3.select(state.shape.node),
                    r = 6 * graph.view.scale,
                    length = path.node().getTotalLength();
				/*
				// Highlight the path with the message (instead of balls running over the path)
				if (highlightPath)
				{
					var arrow = state.shape.node.getElementsByTagName('path')[2],
						arrowPath = d3.select(arrow);
						prevColor = arrowPath.attr("stroke"),
						prevArrowWidth = arrowPath.attr("stroke-width"),
						prevWidth = path.attr('stroke-width');
					if (!arrowPath) return;
					arrowPath.attr("stroke", color).attr('stroke-opacity', 1);
					path.attr("stroke", color).attr('stroke-opacity', 1)
						.transition()
						.duration(length / dotSpeed)
						.ease(d3.easeLinear)
						.on("end", function() {
							arrowPath.attr("stroke", color).attr('stroke-opacity', 0.2);
							path.attr("stroke", "navy").attr('stroke-opacity', 0.2)
						});
					return;
				}
				*/
                link.ballTime = Date.now();
                svg.append("circle")
                    .attr("r", r)
                    .attr("opacity", 0.7)
                    .style('fill', color)
                    .transition()
                    .duration(length / dotSpeed)
                    .ease(d3.easeLinear)
                    .tween("pathTween", function()
                    {
                        var r = d3.interpolate(0, length);//goEast ? d3.interpolate(0, length) : d3.interpolate(length, 0); //Set up interpolation from 0 to the path length
                        return function(t) {
                            var point = path.node().getPointAtLength(r(t)); // Get the next point along the path
                            d3.select(this) // Select the circle
                                .attr("cx", point.x) // Set the cx
                                .attr("cy", point.y) // Set the cy
                        }
                    })
                    .remove()
                    .on("end", function() {
                        if (highlightTarget)
                        {
                            state = graph.view.getState(link.target);
                            var oldStroke = state.shape.stroke;
                            d3.select(state.shape.node.firstChild)
                                .attr("stroke", link.source.color)
                                .attr('stroke-width', 3)
                                .attr("stroke-opacity", 0.4)
                                .transition()
                                .duration(400)
                                .ease(d3.easeLinear)
                                .attr("stroke", oldStroke)
                                .attr('stroke-width', 1)
                                .attr("stroke-opacity", 1)
                        }
                    });
                
            }
        }
    }
    that.init = function()
    {
        // Clear the graph
        var allCells = Object.values(nodes);
		var p = NanoProject.getProject();
        graph.removeCells(allCells, true);
        nodes = {}, links = {}, loadDone = false;
        colors.init();
		recordView.init(p);
		codeEditor.init();
        history.clear();
        graph.model.setEventsEnabled(false);
        $("#projectTitle").html(p?p.settings.name:"");
        if (p)
        {
            that.setViewTitle("Realtime");
            Object.values(p.channels).forEach(o => that.onMsg(o) );
            that.changeView(true);
            graph.zoomTo(1, false);
            $("#mainTabs").tabs("select", 1);
        }
        else
        {
            that.resetViewTitle();
        }
		if (!packageViewOn)
		{
			// Apply user groups
			that.applyGroups();
		}
		else
		{
			// Packages layout
			packages.forEach((pkg) => {
				if (nodes[pkg])
				{
					stackLayout.roots = null;
					stackLayout.execute(nodes[pkg]);
				}
			});
		}
		// Main layout
		//that.executeLayout(true);
        layout.roots = null;
        graph.model.setEventsEnabled(true);
		layout.execute(parent);
        graph.fit(50,null,null,null,null,null,0.9);
	    // Mark load is done. From now on layout execution is done with animation.
        loadDone = true;
    }
    that.setCellSize = function(cell)
    {
        var geo = cell.getGeometry(), swimlane = graph.isSwimlane(cell);
		var getMaxEdgesOnSide = () =>
		{
            if (!cell.edges) return 5;
			var fanIn = 0, fanOut = 0;
			cell.edges.forEach((edge) => {
				if (!executeOnViewChange || edge.visible) (edge.source == cell) ? fanOut++ : fanIn++;
			});
			return (fanIn > fanOut) ? fanIn : fanOut;
		}
		var edges = getMaxEdgesOnSide();
		geo.height = (edges > 1) ? (edges-1)*20 : 30;
        if (geo.width < 100)
            geo.width = 100;
        if (geo.height < 30)
            geo.height = 30;
		if (swimlane)
            geo.width = 150;
        
		return geo;
    }
	that.focus = function(channel)
	{
		var e;
		if (focusedLink)
		{
			e = links[focusedLink];
			e.value = e.title;
		}
		var e = links[channel];
		if (e)
        {
			focusedLink = channel;
			//e.value = "<mark>"+e.title+"</mark>";
			graph.scrollCellToVisible(e, true);
			graph.zoomTo(1, true);
			graph.refresh();
		}
	}
	that.onTrigger = function(o)
	{
        /* For now trigger arrives with the next nano message that triggered the event
		if (recordView.isRecording())
        {
			recordView.trigger(o);
        }
		*/
	}
	/*
	function addToGraph(o,src,tgt)
	{
		var show = ((currentView === true) && !$('#findMethod').val().trim());
		v = nodes[src.hash];
		if (v == undefined) v = that.addVertex(src, show);
		v2 = nodes[tgt.hash];
		if (v2 == undefined) v2 = that.addVertex(tgt, show);
		v.pkg = o.sourcePkg;
		v2.pkg = o.targetPkg;
		var e = that.addEdge(o, v, v2, show);
		// Update the edge color if it has checks and mute icon if it is muted
		o.color = v2.color;
		if (packageViewOn)
		{
			sGrp = nodes[v.pkg];
			if (!sGrp)
			{
				console.log("insert group:"+v.pkg);
				sGrp = graph.insertVertex(parent, null, v.pkg, 0, 0, 200, 280, 'swimlane;');
				sGrp.name = v.pkg;
				sGrp.visible = true;
				nodes[v.pkg] = sGrp;
			}
			tGrp = nodes[v2.pkg];
			if (!tGrp)
			{
				console.log("insert group:"+v2.pkg);
				tGrp = graph.insertVertex(parent, null, v2.pkg, 0, 0, 200, 280, 'swimlane;');
				tGrp.name = v2.pkg;
				tGrp.visible = true;
				nodes[v2.pkg] = tGrp;
			}
			graph.groupCells(sGrp, 10, [v]);
			graph.groupCells(tGrp, 10, [v2]);
			if (sGrp == tGrp)
			{
				graph.groupCells(sGrp, 10, [e]);
			}
			else
			{
				graph.connectCell(e, sGrp, true);
				graph.connectCell(e, tGrp, false);
			}
		}
		that.update(o);
		if (show) that.executeLayout();
	}
    */
	function addToGraph(o,src,tgt)
	{
		var show = ((currentView === true) && !$('#findMethod').val().trim()), sParent = parent, tParent = parent;

		if (packageViewOn)
		{
			if (!nodes[src.pkg])
			{
				var grp = graph.insertVertex(parent, null, src.pkg, 0, 0, 200, 280, 'swimlane;');
				grp.name = src.pkg;
				//grp.collapsed = true;
				nodes[src.pkg] = grp;
				packages.push(grp.name);
			}
			sParent = nodes[src.pkg];
			if (!nodes[tgt.pkg])
			{
				var grp = graph.insertVertex(parent, null, tgt.pkg, 0, 0, 200, 280, 'swimlane;');
				grp.name = tgt.pkg;
				//grp.collapsed = true;
				nodes[tgt.pkg] = grp;
				packages.push(grp.name);
			}
			tParent = nodes[tgt.pkg];
		}
		// Source node
		v = nodes[src.hash];
		if (!v)
		{
			var color = src.color || colors.get(),
				style = "fillColor="+color,
				name = src.name,
				hash = src.hash;
			v = graph.insertVertex(sParent, null, name, 0, 0, 150, 30, style);
			v.color = color;
			v.name = name;
			v.visible = show;
			v.hash = hash;
			if (!show) v.needLayout = true;
			nodes[hash] = v;
		}

		// Target node
		v2 = nodes[tgt.hash];
		if (!v2)
		{
			var color = tgt.color || colors.get(),
				style = "fillColor="+color,
				name = tgt.name,
				hash = tgt.hash;
			v2 = graph.insertVertex(tParent, null, name, 0, 0, 150, 30, style);
			v2.color = color;
			v2.name = name;
			v2.visible = show;
			v2.hash = hash;
			if (!show) v2.needLayout = true;
			nodes[hash] = v2;
		}
		v.pkg = src.pkg;
		v2.pkg = tgt.pkg;

		var from = v, to = v2;
		if (packageViewOn)
		{
			if (src.pkg != tgt.pkg)
			{
				from = sParent;
				to = tParent;
			}
		}
		// The edge
		var name = o.name, channel = o.channel,
			e = graph.insertEdge(parent, null, name, from, to);
        e.origSrc = v;
        e.origTgt = v2;
        // Set the cell size accoring to number of edges connected
        that.setCellSize(v);
        that.setCellSize(v2);
        //e.color = colors.getFromString(o.pipe);//v2.color;
        e.name = channel;
        e.title = name;
        e.inView = (currentView === true);
        e.visible = show;
        if (!e.visible) e.needLayout = true;
        links[channel] = e;
		dummyLinks[v.hash+v2.hash] = e;
		// Update the edge color if it has checks and mute icon if it is muted
		o.color = v2.color;
		// Set mute and edge color
		that.update(o);
		if (show && loadDone)
		{
			that.executeLayout();
			if (packageViewOn)
			{
				stackLayout.roots = null;
				stackLayout.execute(sParent);
				if (sParent != tParent)
				{
					stackLayout.roots = null;
					stackLayout.execute(tParent);
				}
			}
		}
    }
    that.onMsg = function(o)
    {
        // If pipe tab is open, send the message there
        var tab = getSelectedTab();
        if (tab.pipeView)
            tab.pipeView.onMsg(o);
        if (tab.activePipeView)
            tab.activePipeView.onMsg(o);
        var channel = o.channel;
        if (links[channel])
        {
            if (tab.title == "Main View") that.msg(o);
        }
        else
        {
			var source = o.source, src, srcHash = o.srcHash,
				target = o.target, tgt, tgtHash = o.tgtHash,
				v = nodes[source], v2 = nodes[target];
			// Create dummy node if source and target are the same
			if (source == target)
			{
				src = {name: source, hash: srcHash+"Dummy", color: v ? v.color : undefined};
				tgt = {name: target, hash: tgtHash, color: v2 ? v2.color : undefined};
			}
			// Create dummy node if an edge already exist between these 2 nodes
			else if (v && v2 && dummyLinks[v2.hash+v.hash])
			{
				src = {name: source, hash: srcHash+"Dummy", color: v.color};
				tgt = {name: target, hash: tgtHash, color: ""};
			}
			// Create regular link
			else
			{
				src = {name: source, hash: srcHash};
				tgt = {name: target, hash: tgtHash};
			}
			src.pkg = o.sourcePkg;
			tgt.pkg = o.targetPkg;
			addToGraph(o,src,tgt);
        }
        // Send to recording module if we are recording and the link is visible
        if (o.testTriggered && recordView.isRecording() && ($("#displayRecordAll").prop('checked') || links[channel].visible))
            recordView.record(o);
    }
	that.onDeleteChannel = function(o)
    {
        var channel = o.channel, link = links[channel];
        if (!link) return;
        var remove = [], stacks = [];
        // Move over source&target nodes and remove them if they are the only connection of this link.
        for (var i = 0; i < 2; i++)
        {
            var node = (i == 0) ? link.source : link.target;
            // If it's a package, remove it only if it has only 1 child (the node connected to this link)
            if (graph.isSwimlane(node))
            {
                var orig = (i == 0) ? link.origSrc : link.origTgt;
                var count = node.getEdgeCount();
                console.log(orig,count);
                for (e = 0; e < count; e++)
                {
                    var edge = node.getEdgeAt(e);
                    if ((edge.origSrc == orig) || (edge.origTgt == orig))
                    {
                        continue;
                    }
                }
                remove.push(orig);
                stacks.push(node);
                // Only 1 child, remove the whole group
                if (node.getChildCount() == 1)
                {
                    remove.push(node);
                }
            }
            else
            {
                // Regular node, remove if it's the only edge.
                if (node.getEdgeCount() == 1)
                {
                    remove.push(node);
                    delete nodes[node.hash];
                }
            }
        }
        // Remove the edge from the graph
        remove.push(link);
        console.log(remove);
        graph.removeCells(remove);
        // Layout the swimlanes
        stacks.forEach((node) =>
        {
            stackLayout.roots = null;
            stackLayout.execute(node);
        })
        // Delete the link from the links map
        delete links[channel];
        // Delete the channel from the database
        //var p = NanoProject.getProject();
        //delete p.channels[channel];
        //NanoProject.update();
        // Layout
        that.executeLayout();
    }
    that.onChannel = function(o)
    {
        if (recordView.isViewOn() && !recordView.isRecording()) return;
        that.onMsg(o);
    }
    that.addVertex = function(o, show)
    {
        var color = o.color || colors.get(),
            style = "fillColor="+color,
			name = o.name,
			hash = o.hash;
		
		//console.log(p);
        var v = graph.insertVertex(parent, null, name, 0, 0, 150, 30, style);
        v.color = color;
        v.name = name;
        v.visible = show;
        v.hash = hash;
        if (!show) v.needLayout = true;
        nodes[hash] = v;
        //that.addOverlay(v);
        return v;
    }
    /*
	that.addEdge = function(o, v, v2, show)
    {
		var name = o.name, channel = o.channel,
			e = graph.insertEdge(parent, null, name, v, v2);
        e.origSrc = v;
        e.origTgt = v2;
		// Update packages
		//v.pkg = o.sourcePkg;
		//v2.pkg = o.targetPkg;
        // Set the cell size accoring to number of edges connected
        that.setCellSize(v);
        that.setCellSize(v2);
        e.color = v2.color;
        e.name = channel;
        e.title = name;
        e.inView = (currentView === true);
        e.visible = show;
        if (!e.visible) e.needLayout = true;
        links[channel] = e;
		dummyLinks[v.hash+v2.hash] = e;
        return e;
    }
    */
    that.onBranch = function(msg)
    {
        var pipeView = new PipeDraw(msg);
        var activePipeView = new ActiveDraw(msg);
        return;
        console.log(msg);
		// Set the title
		that.setFocusType(currentView.title+" (Method)");
		// Mark all links not in-view
		Object.values(links).forEach((link) => link.inView = false);
		// Set all links in branch in-view
        msg.nodes.forEach(function(e) {
            var channel = Nanobrain.hash(e),
				link = links[channel];
            if (link) link.inView = true;
        });
		that.setVisibility();
    }
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Checks if the browser is supported
    if (!mxClient.isBrowserSupported())
    {
        // Displays an error message if the browser is not supported.
        mxUtils.error('Browser is not supported!', 200, false);
    }
    else
    {
        container = document.getElementById(container);
        mxEvent.disableContextMenu(container);

        // Creates the graph inside the given container
        graph = new mxGraph(container);
        // Disable the graph
        graph.setEnabled(true);
        graph.setPanning(true);
		graph.setTooltips(true);
		graph.tooltipHandler.delay = 10;
		graph.getTooltipForCell = (cell) => { return (cell.isEdge() ? cell.title : cell.name); }
        // Allow folding/collapsing event when graph is disabled
        graph.cellRenderer.forceControlClickHandler = true;
        //graph.autoSizeCellsOnAdd = true;
        graph.setHtmlLabels(true);
        graph.setDropEnabled(false);
        graph.setCellsEditable(false);
        // Disables global features
        graph.collapseToPreferredSize = true;
        graph.constrainChildren = false;
        graph.cellsSelectable = true;
        graph.cellsResizable = false;
        graph.extendParentsOnAdd = false;
        graph.extendParents = false;
        graph.border = 10;
        graph.panningHandler.useLeftButtonForPanning = true;
        //graph.panningHandler.panningEnabled = true;
        graph.view.setTranslate(20, 20);

        // Creates the outline (navigator, overview) for moving
        // around the graph in the top, right corner of the window.
        var outline = document.getElementById('outlineContainer');
        var outln = new mxOutline(graph, outline);
        //outln.updateOnPan = true; // Takes lots of resources
        outln.setZoomEnabled(false);
        if (wrap == false)
        {
            // Truncates the label to the size of the vertex
            graph.getLabel = function(cell)
            {
                var label = (this.labelsVisible) ? this.convertValueToString(cell) : '';
                var geometry = this.model.getGeometry(cell);
                
                if (geometry != null && (geometry.offset == null ||
                    (geometry.offset.x == 0 && geometry.offset.y == 0)) && this.model.isVertex(cell) &&
                    geometry.width >= 2)
                {
                    var style = this.getCellStyle(cell);
                    var fontSize = style[mxConstants.STYLE_FONTSIZE] || mxConstants.DEFAULT_FONTSIZE;
                    var max = geometry.width / (fontSize * 0.625);
                    
                    if (max < label.length)
                    {
                        return label.substring(0, max) + '...';
                    }
                }
                
                return label;
            };
        }

		// Enables rubberband selection
		var rubberband = new mxRubberband(graph);
		rubberband.isForceRubberbandEvent = function(me)
		{
			return mxRubberband.prototype.isForceRubberbandEvent.apply(this, arguments) || mxEvent.isPopupTrigger(me.getEvent()); 
		}
		var rubberbandMouseUp = rubberband.mouseUp;
		rubberband.mouseUp = function(sender, me)
		{
            /*
			if (this.div != null)
			{
				var rect = new mxRectangle(rubberband.x, rubberband.y, rubberband.width, rubberband.height);
				if ((rect.width > 50) && (rect.height > 50))
				{
					graph.zoomToRect(rect);
				}
				this.reset();
			}
			else
			{
				rubberbandMouseUp.apply(this, arguments);
			}
            */
            rubberbandMouseUp.apply(this, arguments);
            // This prevent opening a ruberband menu if a general menu is open (general menu opens when right-clicking an open space in the graph)
            if (graph.popupMenuHandler.isMenuShowing()) return;
			if (me.evt.button == 2)
			{
                graph.popupMenuHandler.popup(me.evt.x-50, me.evt.y-50, true);
            }
		};

        // Gets the default parent for inserting new cells. This
        // is normally the first child of the root (ie. layer 0).
        parent = graph.getDefaultParent();
        //mxConstants.CURSOR_TERMINAL_HANDLE = 'auto';
        // Enables crisp rendering of rectangles in SVG
        mxConstants.ENTITY_SEGMENT = 20;

        mxConstants.WORD_WRAP = "break-word";

        // Sets global styles
        var style = graph.getStylesheet().getDefaultEdgeStyle();
        style[mxConstants.STYLE_EDGE] = mxEdgeStyle.EntityRelation;
        style[mxConstants.STYLE_ENDARROW] = mxConstants.ARROW_CLASSIC_THIN;
		style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = "#FAFAFA10";
		//style[mxConstants.STYLE_FONTCOLOR] = "black";
        style[mxConstants.STYLE_ROUNDED] = true;
        style[mxConstants.STYLE_STROKEWIDTH] = 2;
        //style[mxConstants.STYLE_DASHED] = 1;
        style[mxConstants.STYLE_OPACITY] = 40;
		graph.getStylesheet().putCellStyle('doubleArrow', {...style, startArrow:mxConstants.ARROW_CLASSIC_THIN});

		// Changes the default vertex style in-place
		style = [];
		style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_SWIMLANE;
		style[mxConstants.STYLE_VERTICAL_ALIGN] = 'middle';
		style[mxConstants.STYLE_SPACING] = 20;
		style[mxConstants.STYLE_FONTSIZE] = 11;
		style[mxConstants.STYLE_STARTSIZE] = 22;
		style[mxConstants.STYLE_HORIZONTAL] = true;
		style[mxConstants.STYLE_FONTCOLOR] = 'black';
        style[mxConstants.STYLE_STROKECOLOR] = 'black';
        //style[mxConstants.STYLE_SWIMLANE_FILLCOLOR] = '#CCC';
		graph.getStylesheet().putCellStyle('swimlane', style);

        style = graph.getStylesheet().getDefaultVertexStyle();
        style[mxConstants.STYLE_SPACING_RIGHT] = 20;
        style[mxConstants.STYLE_SPACING_LEFT] = 5;
        style[mxConstants.STYLE_ROUNDED] = true;
        style[mxConstants.STYLE_ARCSIZE] = 10;
        style[mxConstants.STYLE_FILL_OPACITY] = 20;
        style[mxConstants.STYLE_WHITE_SPACE] = (wrap)?"wrap":"nowrap";

        style = [];
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_HEXAGON;
        style[mxConstants.STYLE_SPACING_TOP] = 0;
        style[mxConstants.STYLE_SPACING_LEFT] = 10;
        style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
        graph.getStylesheet().putCellStyle('config', style);

        style = [];
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_CYLINDER;
        //style[mxConstants.STYLE_VERTICAL_ALIGN] = 'bottom';
        style[mxConstants.STYLE_SPACING_TOP] = 10;
        //style[mxConstants.STYLE_SPACING_BOTTOM] = 5;
        graph.getStylesheet().putCellStyle('db', style);
/*
		var stackLayout = new mxStackLayout(graph, false)
		stackLayout.spacing = 10;
		stackLayout.fill = true;
		stackLayout.marginLeft = 30;
		stackLayout.marginRight = 30;
		stackLayout.marginTop = 10;
		stackLayout.marginBottom = 10;
		stackLayout.allowGaps=true;
		stackLayout.resizeParent = true;
*/
        stackLayout = new mxHierarchicalLayout(graph, mxConstants.DIRECTION_WEST);
        stackLayout.interRankCellSpacing = 140; // More spacing between ranks.
        stackLayout.fineTuning = false; // Execute layout runs 8 (!!!) times over the graph if fineTuning is on
        stackLayout.traverseAncestors = false;
		stackLayout.parentBorder = 20;
        stackLayout.interHierarchySpacing = 20;
		stackLayout.resizeParent = true;

        layout = new mxHierarchicalLayout(graph, mxConstants.DIRECTION_WEST);
        layout.interRankCellSpacing = 200; // More spacing between ranks.
        layout.fineTuning = false; // Execute layout runs 8 (!!!) times over the graph if fineTuning is on
        layout.traverseAncestors = false;
/////////////////////////////////////////////////////////////////////
        // Defines custom message shape
        function MessageShape()
        {
            mxCylinder.call(this);
        };
        mxUtils.extend(MessageShape, mxCylinder);
        MessageShape.prototype.redrawPath = function(path, x, y, w, h, isForeground)
        {
            if (isForeground)
            {
                path.moveTo(0, 0);
                path.lineTo(w / 2, h / 2);
                path.lineTo(w, 0);
            }
            else
            {
                path.moveTo(0, 0);
                path.lineTo(w, 0);
                path.lineTo(w, h);
                path.lineTo(0, h);
                path.close();
            }
        };
        // Registers and defines the custom marker
        mxMarker.addMarker('mute', function(canvas, shape, type, pe, unitX, unitY, size, source, sw, filled)
        {
            var nx = unitX * (size + sw + 1);
            var ny = unitY * (size + sw + 1);
            return function()
            {
                canvas.image(pe.x, pe.y-8, 16, 16, 'images/mute.png');
                //canvas.begin();
                //canvas.moveTo(pe.x - nx / 2 - ny / 2, pe.y - ny / 2 + nx / 2);
                //canvas.lineTo(pe.x + ny / 2 - 3 * nx / 2, pe.y - 3 * ny / 2 - nx / 2);
                //canvas.stroke();
            };
        });
///////////////////////////////////////////////////////////////////////

        // Registers the message shape
        mxCellRenderer.registerShape('message', MessageShape);
        /*
        graph.addListener(mxEvent.CELL_CONNECTED, function(sender, evt)
        {
            var edge = evt.getProperty('edge');
            if (edge.source && edge.target)
            {
                console.log(edge.source);
                console.log(edge.target);
            }

        });
        */
        /*
        // *** NO NEED to override this now since user object is string with name ***
        // Get the cell label. From user value object, or if not object - value is the label.
        graph.convertValueToString = function(cell)
        {
            var user = cell.value;
            return (user.label) ? user.label : user;
        };
        */
        // Installs a click handler to handle edge clicks only (cells are interacted using their overlay)
        graph.addListener(mxEvent.CLICK, (sender, evt) =>
		{
			var cell = evt.getProperty('cell');
            if (cell)
            {
				var event = evt.getProperty('event');
				if (event.button == 0)
				{
					if (graph.isSwimlane(cell))
					{
						graph.foldCells(!cell.isCollapsed(), false, [cell]);
						//stackLayout.roots = null;
						//stackLayout.execute(cell);
						return;
					}
                    if (event.ctrlKey && cell.isVertex()) return;
                    if (cell.isVertex())
                    {
                        if (history.add(cell))
                        {
                            $('#findMethod').val("").blur();
                            that.changeView(cell);
                        }
                    }
                    else
                    {
                        that.changeView(cell);
                    }
				}
            }
		});
		// Keeps widths on collapse/expand	
        graph.addListener(mxEvent.FOLD_CELLS, (sender, evt) =>
		{
			var cells = evt.getProperty('cells'),
				cell = cells[0],
				collapsed = evt.getProperty('collapse');
			that.changeStyle(cell, [{key: 'swimlaneFillColor', value: collapsed?'gradient-#798cc3':'none'}]);
			var cellParent = cell.getParent();
			if (cellParent == parent)
			{
				stackLayout.roots = null;
				stackLayout.execute(cell);
				that.executeLayout();
			}
			else
			{
				stackLayout.roots = null;
				stackLayout.execute(cellParent);
			}
		});
        /*
        graph.model.addListener(mxEvent.END_UPDATE, function(sender, evt)
        {
            console.log("END_UPDATE");
            console.log(evt);
            for (var key in links)
            {
                var link = links[key];
                var dashed = (link.source.geometry.x > link.target.geometry.x)?1:0;
                var model = graph.model;
                //graph.setCellStyles('dashed', dashed, [link]);
                var style = mxUtils.setStyle(model.getStyle(link), 'dashed', dashed);
                model.setStyle(link, style);
            }
        });
        */
        // no need since this is done when adding vertex/edge
        var graphGetPreferredSizeForCell = graph.getPreferredSizeForCell;
        graph.getPreferredSizeForCell = function(cell)
        {
            //var result = graphGetPreferredSizeForCell.apply(this, arguments);
            //return result;
			return that.setCellSize(cell);
        };
        var marker = new mxCellMarker(graph, "navy");
        var highlightedCell = null;
        graph.addMouseListener(
        {
            mouseDown: function() {
                codeEditor.getMethod(null);
            },
            mouseMove: function(sender, me)
            {
                var cell = me.getCell();
                if (highlightOnMouseOver)
                {
                    if (highlightedCell)
                    {
                        that.highlightBranch(highlightedCell, false);
                        highlightedCell = null;
                    }
                    if (cell)
                    {
                        that.highlightBranch(cell, true);
                        highlightedCell = cell;
                    }
                }
                else
                {
                    if (!cell)
                    {
						codeEditor.getMethod(null);
                        marker.process(me);
                    }
                    else
                    {
                        if (cell.isEdge())
						{
							var x = me.getX(), y = me.getY();
							marker.process(me);
							codeEditor.getMethod(cell.name,x,y);
						}
                        else
						{
							marker.reset();
							codeEditor.getMethod(null);
						}
                    }
                }
            },
            mouseUp: function() {}
        });
        // Adds mouse wheel handling for zoom
        mxEvent.addMouseWheelListener(function(evt, up)
        {
            var c = window.getComputedStyle(container).getPropertyValue('border-top-style');
            if (c === 'hidden')
            {
                //let p1 = graph.getPointForEvent(evt, false);
                var scale = graph.view.scale;
                if (up)
                {
                    if (scale < 2)
                        graph.zoomIn();
                }
                else
                {
                    if (scale > 0.2)
                        graph.zoomOut();
                }
                // Zoom to mouse position
                //let p2 = graph.getPointForEvent(evt, false);
                //let deltaX = p2.x - p1.x;
                //let deltaY = p2.y - p1.y;
                //let view = graph.view;
                //view.setTranslate(view.translate.x + deltaX, view.translate.y + deltaY);
            }

            //mxEvent.consume(evt);
        });
		// Configures automatic expand on mouseover
		graph.popupMenuHandler.autoExpand = true;
		graph.popupMenuHandler.selectOnPopup = false;
		// Installs context menu
		graph.popupMenuHandler.factoryMethod = function(menu, cell, evt)
		{
			var p = NanoProject.getProject();
			if (!p) return;
            // Rubber band menu
			if (cell === true)
			{
                var rect = new mxRectangle(rubberband.x, rubberband.y, rubberband.width, rubberband.height);
                if ((rect.width < 20) || (rect.height < 20)) return;
				var title = menu.addItem("Selected section", null, null, null, null, true, false);
                $(title).css({"font-weight":"Bold","cursor":"default","text-decoration":"underline"});
                var selected = graph.getSelectionCount();
				menu.addItem('Zoom to section', './images/search.png', function()
				{
					graph.clearSelection();
					graph.zoomToRect(rect);
                });
                if (selected > 1)
                {
                    title = menu.addItem(selected+" cells selected", null, null, null, null, true, false);
                    $(title).css({"font-weight":"Bold","cursor":"default","text-decoration":"underline"});
                    menu.addItem('Group cells', './images/add.png', function()
                    {
                        $.messager.prompt('New Group', 'Please enter group name:', function(r){
                            if (r)
                            {
                                if (nodes[r])
                                    $.messager.alert('Error','Name already exist','error');
                                else
                                    that.group(r);
                            }
                        });
                    });
                }
				return;
			}
			// General menu
			if (!cell)
			{
				var title = menu.addItem("General Options", null, null, null, null, true, false);
				$(title).css({"font-weight":"Bold","cursor":"default","text-decoration":"underline"});
				menu.addItem('Full View', './images/Home.gif', function()
				{
					$("#findMethod").val("");
					$("#findPipe").val("");
					that.findMethod(false);
                });
                menu.addItem('Expand packages', './images/Plus_green.gif', function()
				{
                    packages.forEach((pkg) => {
                        if (nodes[pkg])
                            graph.foldCells(false, false, [nodes[pkg]]);
                    });
                });
                menu.addItem('Collapse packages', './images/Minus_green.gif', function()
				{
                    packages.forEach((pkg) => {
                        if (nodes[pkg])
                            graph.foldCells(true, false, [nodes[pkg]]);
                    });
				});
                menu.addSeparator();
                menu.addItem('Clear View', './images/map_delete.png', function()
				{
                    NanoProject.deleteChannels();
				});
				menu.addItem('Close Project', './images/no.png', function()
				{
					NanoProject.close();
				});
				menu.addItem('Project Properties', './images/doc.png', function()
				{
					NanoProject.openProjectDialog(p.settings.name);
				});
				return;
			}
			// Edge menu
			if (cell.isEdge())
			{
				var edge = NanoProject.getChannel(cell.name);
				var title = menu.addItem(cell.title, null, null, null, null, true, false);
                $(title).css({"font-weight":"Bold","cursor":"default","text-decoration":"underline"});
                menu.addItem('Delete Method', './images/delete.png', function()
				{
					that.onDeleteChannel(edge);
				});
				menu.addItem('Focus Method', './images/search.png', function()
				{
					$("#findMethod").val(cell.title);
					that.findMethod(false);
				});
				menu.addItem('Focus Pipe', './images/Link.gif', function()
				{
					$("#findPipe").val(edge.pipe);
					that.findPipe(true);
				});
				menu.addItem('Show Code', './images/doc.png', function()
				{
					codeEditor.fetchFile(cell.name);
                });
                menu.addItem(edge.mute ? 'Unmute Channel' : 'Mute Channel', edge.mute ? './images/ok.png':'./images/no.png', function()
				{
                    edge.mute = !edge.mute;
                    NanoProject.update();
					that.update(edge);
				});
				menu.addSeparator();
				var submenu1 = menu.addItem('Activity', './images/clock.png', null);
				var start = NanoProject.triggerStart(cell.name);
				menu.addItem('Trigger Start', start ? './images/no.png':'./images/ok.png', function()
				{
					NanoProject.triggerStart(cell.name, !start);
					recordView.buildTriggers();
					NanoProject.update();
				}, submenu1);
				var stop = NanoProject.triggerStop(cell.name);
				menu.addItem('Trigger Stop', stop ? './images/no.png':'./images/ok.png', function()
				{
					NanoProject.triggerStop(cell.name, !stop);
					recordView.buildTriggers();
					NanoProject.update();
				}, submenu1);
				var list = NanoProject.inList(cell.name);
				menu.addItem('White/Black list', list ? './images/no.png':'./images/ok.png', function()
				{
					NanoProject.inList(cell.name, !list);
					recordView.buildTriggers();
					NanoProject.update();
				}, submenu1);
				var pipe = NanoProject.pipeList(cell.name);
				menu.addItem('Pipe', pipe ? './images/no.png':'./images/ok.png', function()
				{
					NanoProject.pipeList(cell.name, !pipe);
					recordView.buildTriggers();
					NanoProject.update();
				}, submenu1);
				menu.addSeparator();
				menu.addItem('Properties', './images/doc.png', function()
				{
					chDialog.open(cell.name);
				});
				return;
			}
			// Group menu
			if (graph.isSwimlane(cell))
			{
				var title = menu.addItem(cell.name, null, null, null, null, true, false);
				$(title).css({"font-weight":"Bold","cursor":"default","text-decoration":"underline"});
				menu.addItem('Ungroup', './images/delete.png', function()
				{
					that.ungroup(cell);
				});
                menu.addItem('Rename', './images/pencil.png', function()
				{
					$.messager.prompt('Rename Group', 'Please enter group name:', function(r){
                        if (r)
                        {
                            if (nodes[r])
                                $.messager.alert('Error','Name already exist','error');
                            else
                            {
                                that.renameGroup(cell, r);
                            }
                        }
                    });
                    $('.messager-input').val(cell.name).focus();
                });
                menu.addItem('Zoom', './images/search.png', function()
				{
                    that.changeView(cell);
				});
				return;
			}
			// Cell menu
			var title = menu.addItem(cell.name, null, null, null, null, true, false);
			$(title).css({"font-weight":"Bold","cursor":"default","text-decoration":"underline"});
			menu.addItem('Focus Class', './images/search.png', function()
			{
				$("#findMethod").val(cell.name);
				that.findMethod(false);
			});
            if (cell.getParent() != parent)
            {
                menu.addItem('Remove from group', './images/no.png', function()
                {
                    that.removeFromGroup(cell);
                });
            }
            var submenu1 = menu.addItem('Add to group...', './images/add.png', null);
            for (var key in nodes)
            {
                var node = nodes[key];
                if (graph.isSwimlane(node))
                {
                    menu.addItem(key, '', function()
                    {
                        that.addToGroup(cell, node);
                    }, submenu1);
                }
            }
		};
        // Remove some listeners to make zoom faster
        if (removeScaleAndTranslateListeners)
        {
            if (graph.view.eventListeners != null)
            {
                var i = 0;
                while (i < graph.view.eventListeners.length)
                {
                    if (graph.view.eventListeners[i] == mxEvent.SCALE_AND_TRANSLATE)
                    {
                        graph.view.eventListeners.splice(i, 2);
                    }
                    else
                    {
                        i += 2;
                    }
                }
            }
        }
        mxGraph.prototype.isCellSelectable = function(cell)
        {
            return this.isCellsSelectable() && cell.isVertex() && !graph.isSwimlane(cell);
        };
    }

    return that;
};
