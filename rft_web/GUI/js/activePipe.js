ActiveDraw = function(msg) {
    var that = this,
        graph, parent, layout, nodesCount = 0,
        nodes = {}, links = {}, loadDone = true, depthLevel = 0;

    var colors  = new ColorBank();
    var theChannel = msg.channel, thePipe;
    // Configuration
    var wrap = false; // Wrap text (true), or truncate to fit size (false)

    var container = msg.name+"Active", outlineContainer = container+"Outline", content, tabTitle = msg.name+" Activity";
    content  = '<div style="overflow:hidden;width:100%;height:100%">';
    content += '    <div style="border-bottom: 1px solid navy; width: 100%;height:92px; padding: 3px">';
    content += '        <div id="'+outlineContainer+'" style="float:left;overflow:hidden;width:160px;height:90px;background:white;z-index:10;border:2px solid lightgray;margin-right:20px"></div>';
    content += '    </div>';
    content += '    <div id="'+container+'" class="draw_holder">';
    content += '</div>';
    // Add the tab, and add reference to this
    addTab(tabTitle, content);
    var tab = getSelectedTab();
    tab.activePipeView = that;

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
        var outline = document.getElementById(outlineContainer);
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

        layout = new mxHierarchicalLayout(graph, mxConstants.DIRECTION_WEST);
        layout.interRankCellSpacing = 150; // More spacing between ranks.
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
					console.log("Click");
				}
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
       /*
        // no need since this is done when adding vertex/edge
        var graphGetPreferredSizeForCell = graph.getPreferredSizeForCell;
        graph.getPreferredSizeForCell = function(cell)
        {
            //var result = graphGetPreferredSizeForCell.apply(this, arguments);
            //return result;
			return that.setCellSize(cell);
        };
        */
        var marker = new mxCellMarker(graph, "navy");
        var highlightedCell = null;
        graph.addMouseListener(
        {
            mouseDown: function() {},
            mouseMove: function(sender, me)
            {
                var cell = me.getCell();
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
        mxGraph.prototype.isCellSelectable = function(cell)
        {
            return this.isCellsSelectable() && cell.isVertex() && !graph.isSwimlane(cell);
        };
    }

    that.executeLayout = function(r, change, post)
    {
        graph.getModel().beginUpdate();
        try
        {
            if (change != null)
            {
                change();
            }

            layout.roots = null;
            layout.execute(parent);
        }
        catch (e)
        {
            throw e;
        }
        finally
        {
            if (loadDone)
            {
                // New API for animating graph layout results asynchronously
                var morph = new mxMorphing(graph);
                morph.addListener(mxEvent.DONE, mxUtils.bind(this, function()
                {
                    graph.getModel().endUpdate();
                    if (r) graph.scrollCellToVisible(r, true);
                    if (post != null)
                    {
                        post();
                    }
                }));
                
                morph.startAnimation();
            }
            else
            {
                graph.getModel().endUpdate();
                graph.center();
                console.log("Centered");
            }
        }
    };
    that.onMsg = function(o)
    {
        var channel = o.channel;
        var link = links[channel];
        if (o.channel == theChannel)
        {
            thePipe = o.pipe;
        }
        if (o.pipe != thePipe) return;
        if (!link)
        {
            
            that.onChannel(o);
        }
        else
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
                link.ballTime = Date.now();
                svg.append("circle")
                    .attr("r", r)
                    .attr("opacity", 0.7)
                    .style('fill', color)
                    .transition()
                    .duration(length / 0.5)
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
                    .remove();
            }
        }
    }
    that.onChannel = function(o)
    {
        var //source = o.node,
            channel = o.channel,
            source = o.source,
            target = o.target;
        if (links[channel])
        {
//            that.msg(channel, payload);
        }
        else
        {
            // Add the nodes if needed
            var v = nodes[source];
            if (v == undefined) v = that.addVertex(source);
            var v2 = nodes[target]
            if (v2 == undefined) v2 = that.addVertex(target);

            var style = "labelBackgroundColor=#FFFFFF;"
            var e = graph.insertEdge(parent, null, o.name, v, v2, style);
            //graph.updateCellSize(v);
            //graph.updateCellSize(v2);
            that.setCellSize(v);
            that.setCellSize(v2);
            graph.view.refresh();
            //e.color = v2.color;
            e.name = channel;
            links[channel] = e;

            o.color = v2.color;
            if (loadDone)
                that.executeLayout();
        }
    }
    that.addVertex = function(name)
    {
        var color = colors.get(),
            style = "fillColor="+color;
        nodesCount++;
        var x = (nodesCount % 3) * 200;
        var y = (nodesCount / 3) * 200;
        var v = graph.insertVertex(parent, null, name, x, y, 150, 30, style);
        v.color = color;
        v.name = name;
        v.visible = true;
        v.movable = true;
        nodes[name] = v;
        return v;
    }
    that.setCellSize = function(cell)
    {
        var geo = cell.getGeometry();
		var getMaxEdgesOnSide = () =>
		{
            if (!cell.edges) return 5;
			var fanIn = 0, fanOut = 0;
			cell.edges.forEach((edge) => {
				if (edge.visible) (edge.source == cell) ? fanOut++ : fanIn++;
			});
			return (fanIn > fanOut) ? fanIn : fanOut;
		}
		var edges = getMaxEdgesOnSide();
		geo.height = (edges > 1) ? (edges-1)*20 : 30;
        if (geo.width < 100)
            geo.width = 100;
        if (geo.height < 30)
            geo.height = 30;
        
		return geo;
    }

    return that;
};