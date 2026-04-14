MxDraw2 = function(container) {
    var that = {},
        graph, parent, layout, nodesCount = 0,
        nodes = {}, links = {}, loadDone = false;

    var history = new UndoRedo();
    var colors  = new ColorBank();

    // Configuration
    var dotSpeed = 0.5; // Dot speed
    var highlightTarget = false; // Highlight the target border when message arrives
    var showNodeDetailsAsPopup = false; // Show the node details as popup or in the east view
    var wrap = false; // Wrap text (true), or truncate to fit size (false)
    var colorEdges = false;

    that.debug = function()
    {
        //graph.clear();
        //var allCells = Object.values(nodes);
        //graph.removeCells(allCells, true);
        graph.center();
        /*
        var keys = Object.keys(links);
        var ch = keys[ keys.length * Math.random() << 0];
        function uuidv4() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
        }
        that.msg(ch, uuidv4());
        */
    }
    that.setEdgeColor = function(channel, color)
    {
        var link = links[channel];
        var style = mxUtils.setStyle(link.getStyle(), 'strokeColor', color);
        graph.model.setStyle(link, style);
    }
    that.update = function(edge)
    {
        var channel = edge.channel;
        that.setMute(channel, edge.mute);
        that.setEdgeColor(channel, (edge.checks.length>0)?'green':null);
    }
    that.setMute = function(channel, mute)
    {
        var link = links[channel];
        var style = mxUtils.setStyle(graph.model.getStyle(link), 'startArrow', mute?'mute':'');
        graph.model.setStyle(link, style);
    }
    that.home = function()
    {
        //history.add(0);
        that.changeView(null);
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
    that.changeView = function(cell)
    {
        //Back/forward buttons state
        $("#mxBack").linkbutton(history.canUndo()?'enable':'disable');
        $("#mxForward").linkbutton(history.canRedo()?'enable':'disable');
        var allCells = Object.values(nodes);
        // Show all?
        if (!cell)
        {
            graph.toggleCells(true, allCells, true);
        }
        else
        {
            graph.toggleCells(false, allCells, true);
            for (var i = 0; i < cell.getEdgeCount(); i++)
            {
                var edge = cell.getEdgeAt(i);
                graph.toggleCells(true, [edge.target]);
                graph.toggleCells(true, [edge.source]);
            }
            graph.toggleCells(true, [cell], true);
        }
        that.executeLayout(cell);
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
            that.setDashed();
        }
    };
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
    that.alert = function(channel, on)
    {
        var link = links[channel];
        //graph.removeCellOverlays(link);
        graph.setCellWarning(link, 'Tooltip');
    }
    that.msg = function(channel, msg)
    {
        return;
        var link = links[channel];
        if (link)
        {
            // Check if this channel is in the model view and update the message.
            var l = $("#popupContent div[name='"+link.name+"']");
            if (l.length > 0) l.html(msg);
            // Add a circle
            var state = graph.view.getState(link);
            if (state)
            {
                //var innerPath = state.shape.node.getElementsByTagName('path')[0];
                var outerPath = state.shape.node.getElementsByTagName('path')[1],
                    color = link.target.color,
                    path = d3.select(outerPath),
                    svg = d3.select(state.shape.node),
                    r = 6 * graph.view.scale,
                    length = path.node().getTotalLength();

                svg.append("circle")
                    .attr("r", r)
                    .attr("opacity", 0.7)
                    .style('fill', color)
                    .transition()
                    .duration(length / dotSpeed)
                    .ease(d3.easeLinear)
                    .tween("pathTween", function() {
                        var r = d3.interpolate(0, length); //Set up interpolation from 0 to the path length
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
        graph.removeCells(allCells, true);
        nodes = {}, links = {}, loadDone = false;
        colors.init();
        history.clear();
        var chans = Nanoware.getChannels();
        for (var c in chans)
        {
            that.onChannel(chans[c]);
        }
        // Execute the layout. Without animation since load is not done yet.
        that.home();
        graph.zoomTo(1, true);
        that.executeLayout();
        // Mark load is done. From now on layout execution is done with animation.
        loadDone = true;
    }
    that.onChannel = function(o)
    {
        var //source = o.node,
            channel = o.channel,
            source = o.source,
            target = o.target,
            payload = o.payload,
            kind = o.ObjectKind;
        if (links[channel])
        {
            that.msg(channel, payload);
        }
        else
        {
            // Add the nodes if needed
            var v = nodes[source];
            if (v == undefined) v = that.addVertex(source, kind);
            var v2 = nodes[target]
            if (v2 == undefined) v2 = that.addVertex(target, kind);

            var style = "labelBackgroundColor=#FFFFFF;"
            var e = graph.insertEdge(parent, null, o.name, v, v2, style);
            graph.updateCellSize(v);
            graph.updateCellSize(v2);
            graph.view.refresh();
            //e.color = v2.color;
            e.name = channel;
            links[channel] = e;

            o.color = v2.color;
            that.update(o);
            if (loadDone)
                that.executeLayout();
        }
    }
    that.addVertex = function(name, kind)
    {
        var color = colors.get(),
            kind = kind.toLowerCase(),
            isDb = kind.includes("repository"),
            isCfg = kind.includes("config"),
            style = "fillColor="+color;
        if (isDb) style += ";db";
        if (isCfg) style += ";config";
        nodesCount++;
        var x = (nodesCount % 3) * 200;
        var y = (nodesCount / 3) * 200;
        var v = graph.insertVertex(parent, null, name, x, y, 150, 30, style);
        v.color = color;
        v.name = name;
        v.visible = loadDone;
        v.movable = true;
        nodes[name] = v;
        that.addOverlay(v);
        return v;
    }
    that.modelView = function(c, e)
    {
        if (!c)
        {
            if (showNodeDetailsAsPopup)
            {
                $("#popup").dialog("close");
            }
            else
            {
                $("#mx_tree").show();
                $("#nodeView").hide();
            }
            return;
        }
        var name = c.name;
        var txt = "",
            srcs = "", tgts = "",
            title = (c.isEdge()?"Channel: ":"Node: ")+name;
        model = name;
        if (c.isVertex())
        {
            const hex2rgba = (hex, alpha = 0.2) => {
                const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
                return `rgba(${r},${g},${b},${alpha})`;
            };
            var edges = c.isEdge() ? [c] : c.edges;
            var style = "padding:3px; display: inline-block; vertical-align: middle; width: 120px; overflow-wrap: break-word; text-align: center;";
            for (var i = 0; i < edges.length; i++)
            {
                var edge = edges[i],
                    src = edge.source,
                    tgt = edge.target,
                    row;
                row = "<div style='margin:5px 0px;'>";
                row += "<span style='"+style+"background-color:"+hex2rgba(src.color)+"'>"+src.name+"</span>";
                row += " &#10132; ";
                row += "<span style='"+style+"background-color:"+hex2rgba(tgt.color)+"'>"+edge.name+"</span>";
                row += " &#10132; ";
                row += "<span style='"+style+"background-color:"+hex2rgba(tgt.color)+"'>"+tgt.name+"</span>";
                row += "</div>";
                row += "<div style='margin:5px 0px;' name='"+edge.name+"'>"+Nanoware.getChannel(edge.name).messages.last()+"</div>";

                if (edge.target === c)
                    srcs += row;
                else
                    tgts += row;
            }
            if (srcs !== "")
                txt += "<b>Sources:</b>"+srcs;
            if (tgts !== "")
                txt += "<b>Targets:</b>"+tgts;
        }
        else
        {
            var o = Nanoware.getChannel(name);
            for (var key in o)
            {
                var val = o[key];
                txt += "<div style='margin:5px 10px;'>";
                txt += "<span style='font-weight: bold'>"+key+": </span>";
                if (Array.isArray(val))
                {
                    val.forEach(function(element) {
                        txt += "<br><span>"+element+"</span>";
                    });
                }
                else
                {
                    txt += "<span>"+val+"</span>";
                }
                
                txt += "</div>";
            }
        }
        if (c.isVertex())
        {
            if (showNodeDetailsAsPopup)
            {
                $("#popup").panel({title: title});
                $("#popupContent").html(txt);
                $("#popup").dialog("open");
                var w = $('#popup').panel().width();
                var h = $('#popup').panel().height();
                var x = e.getX();
                var y = e.getY();
                if (x > 1000) x -= (w+30);
                else x += 30;
                if (y > 500) y -= (h+50);
                else y += 20;
                $('#popup').panel('move',{ left: x, top: y });
            }
            else
            {
                $("#mx_tree").hide();
                $("#nodeView").html(txt);
                $("#nodeView").show();
            }
        }
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

        // Allow folding/collapsing event when graph is disabled
        graph.cellRenderer.forceControlClickHandler = true;
        //graph.autoSizeCellsOnAdd = true;
        graph.setHtmlLabels(true);
        graph.setDropEnabled(false);
        graph.setCellsEditable(false);
        // Disables global features
        graph.collapseToPreferredSize = true;
        graph.constrainChildren = false;
        graph.cellsSelectable = false;
        graph.extendParentsOnAdd = false;
        graph.extendParents = false;
        graph.border = 10;
        graph.panningHandler.useLeftButtonForPanning = true;
        graph.view.setTranslate(20, 20);

        // Creates the outline (navigator, overview) for moving
        // around the graph in the top, right corner of the window.
        //var outline = document.getElementById('outlineContainer');
        //var outln = new mxOutline(graph, outline);
        //outln.updateOnPan = true; // Takes lots of resources
        //outln.setZoomEnabled(false);
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
        //new mxRubberband(graph);
        
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
        style[mxConstants.STYLE_ROUNDED] = true;
        style[mxConstants.STYLE_STROKEWIDTH] = 2;
        //style[mxConstants.STYLE_DASHED] = 1;
        style[mxConstants.STYLE_OPACITY] = 40;

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


        //layout = new mxCircleLayout(graph);
        layout = new mxGraphLayout(graph);
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
        graph.addListener(mxEvent.CLICK, function(sender, evt)
        {
            var cell = evt.getProperty('cell');
            if (cell)
            {
                if (cell.isEdge())
                {
                    chDialog.open(cell.name);
                    //$("#checkDlg").dialog({ title: "Channel \"" + cell.name + "\"" });
                    //$("#dlgContent").html("Last Message: "+cell.messages.last());
                    //$("#checkDlg").dialog( "open" );
                }
                else
                {
                    history.add(cell);
                    that.changeView(cell);
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
        
        var graphGetPreferredSizeForCell = graph.getPreferredSizeForCell;
        graph.getPreferredSizeForCell = function(cell)
        {
            var result = graphGetPreferredSizeForCell.apply(this, arguments);
            var style = this.getCellStyle(cell);
            
            var edges = cell.getEdgeCount();
            if (edges > 1)
                result.height += (edges-1)*20;
            if (result.width < 100)
                result.width = 100;
            if (result.height < 30)
                result.height = 30;
            if (style.shape === mxConstants.SHAPE_ELLIPSE) result.height = result.width;
            return result;
        };
        var marker = new mxCellMarker(graph, "navy");
        graph.addMouseListener(
        {
            mouseDown: function() {},
            mouseMove: function(sender, me)
            {
                var cell = me.getCell();
                that.modelView(cell, me);
                if (!cell)
                {
                    marker.process(me);
                }
                else
                {
                    if (cell.isEdge()) marker.process(me);
                    else marker.reset();
                }
            },
            mouseUp: function() {}
        });
        // Adds mouse wheel handling for zoom
        mxEvent.addMouseWheelListener(function(evt, up)
        {
            var c = window.getComputedStyle(document.getElementById('mx_holder2')).getPropertyValue('border-top-style');
            if (c === 'hidden')
            {
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
            }

            //mxEvent.consume(evt);
        });
    }

    return that;
};