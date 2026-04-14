/*
function BasicSensor ()
{
    var dom = null;
    this.enable = (show) => { if (show) dom.show(); else dom.hide(); }
}
*/
class BasicSensor
{
    constructor(name) {
        this.name = name;
        this.dom = null;
        this.enabled = false;
    }
    enable(show) { if (show) this.dom.show(); else this.dom.hide(); this.enabled = show; }
    getDomElement() { return this.dom; }
    isEnabled() { return this.enabled; }
}
class GaugeSensor extends BasicSensor
{
    constructor(name)
    {
        super(name);
        this.dom = $("<canvas />");
        this.gauge = new RadialGauge({
          renderTo: this.dom[0],
          title: this.name,
          value: 0,
          colorNumbers: 'red',
          minValue: 0,
          maxValue: 100,
          width: 200,
          height: 200
        });
        this.dom.hide();
    }
    update(val) { this.gauge.update({ value: val }) }
    setMinMax(min,max)
    {
        min = parseInt(min);
        max = parseInt(max);
        var majorTicks = [],
            highlights = [], i;
        for (i = 0; i <= 5; i ++)
        {
            majorTicks.push(min + Math.floor((max/5)*i));
        }
        highlights.push({ from: min + Math.floor((max/5)*3), to: min + Math.floor((max/5)*4), color: '#cccccc' });
        highlights.push({ from: min + Math.floor((max/5)*4), to: min + Math.floor((max/5)*5), color: '#999999' });
        this.gauge.update({ minValue: min, maxValue: max, majorTicks: majorTicks, highlights: highlights });
    }
    getMin() { return this.gauge.options.minValue; }
    getMax() { return this.gauge.options.maxValue; }
}

class CounterSensor extends BasicSensor
{
    constructor(name)
    {
        super(name);
        this.dom = $("<div style='border:1px solid black; margin:5px; padding:2px'></div>");
        this.dom.hide();
    }
    update(val) { this.dom.html(this.name+": "+val); }
}

class GraphSensor extends BasicSensor
{
    constructor(name)
    {
        super(name);
        this.dom = $("<canvas />");
        var config = {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: name,
                    backgroundColor: 'navy',
                    borderColor: 'navy',
                    data: [ ],
                    fill: false,
                }]
            },
            options: {
                responsive: true,
                title: {
                    display: false,
                    text: name + ' Chart'
                },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                },
                hover: {
                    mode: 'nearest',
                    intersect: true
                },
                scales: {
                    xAxes: [{
                        display: false,
                        scaleLabel: {
                            display: true,
                            labelString: 'Month'
                        }
                    }],
                    yAxes: [{
                        display: true,
                        ticks: {
                            beginAtZero: true
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Value'
                        }
                    }]
                }
            }
        };
        var ctx = this.dom[0].getContext('2d');
        this.graph = new Chart(ctx, config);
        this.dom.hide();
    }
    update(val)
    {
        var date = new Date();
        var time = date.toLocaleString('en-US').replace(',','');
        this.graph.data.labels.push(time);
        this.graph.data.datasets[0].data.push(val);
        //graph.update(0); prevent animation?
        this.graph.update();
    }
}
function SensorsDb()
{
    var sensors = [], selectedSensor;
    $( "#sensorDlg" ).dialog({
        width: 400,
        height: 350,
        modal: false,
        closed: true,
        buttons: [
            {
                text: "Ok",
                handler: function() {
                    var sensor = sensors[selectedSensor];
                    if (sensor)
                    {
                        sensor.counter.enable($("#sensorCounterEnable").prop("checked"));
                        sensor.counter.update(sensor.val);
                        sensor.gauge.enable($("#sensorGaugeEnable").prop("checked"));
                        sensor.gauge.setMinMax($("#sensorGaugeMin").val(),$("#sensorGaugeMax").val());
                        sensor.gauge.update(sensor.val);
                        sensor.graph.enable($("#sensorGraphEnable").prop("checked"));
                    }
                    $('#sensorDlg').dialog('close');
                }
            },
            {
                text: "Cancel",
                handler: function() {
                    $('#sensorDlg').dialog('close');
                }
            }
        ]
    });
    this.onSensor = (o) =>
    {
        var name = o.name,
            sensor = sensors[name];
        if (!sensor)
        {
            var div = $("<div>").html("<div class='checkRowWrapper'><a href='#' iconCls='icon-add' class='easyui-linkbutton addSensor'>Edit</a></div>");
            sensor = div;
            // Gauge
            var gauge = new GaugeSensor(name);
            sensor.gauge = gauge;
            div.prepend(gauge.getDomElement());
            // Counter
            var counter = new CounterSensor(name);
            sensor.counter = counter;
            div.prepend(counter.getDomElement());
            // Graph
            var graph = new GraphSensor(name);
            sensor.graph = graph;
            div.prepend(graph.getDomElement());

            // The edit button
            var edit = div.find(".addSensor");
            edit.linkbutton();
            edit.on('click', function()
            {
                selectedSensor = name;
                $("#sensorGaugeMin").val(sensor.gauge.getMin());
                $("#sensorGaugeMax").val(sensor.gauge.getMax());
                $("#sensorGaugeEnable").prop("checked", sensor.gauge.isEnabled());
                $("#sensorCounterEnable").prop("checked", sensor.counter.isEnabled());
                $("#sensorGraphEnable").prop("checked", sensor.graph.isEnabled());
                $("#sensorDlg").dialog({ title: "Sensor: "+name }).dialog( "open" );
            });

            // Make a panel from this div
            $('#sensorsDiv').append(div);
            div.panel({
                width:600,
                //height:120,
                title: name,
                collapsible:true,
                tools:[
                        {
                            iconCls:'icon-delete',
                            handler: function(){ div.panel('destroy'); }
                        }
                    ]
            });
            sensors[name] = sensor;
        }
        sensor.val = o.payload;
        if (sensor.gauge.isEnabled())
            sensor.gauge.update(o.payload);
        if (sensor.counter.isEnabled())
            sensor.counter.update(o.payload);
        if (sensor.graph.isEnabled())
            sensor.graph.update(o.payload);
    }
    return this;
}
