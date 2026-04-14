
var Nanoware = new function() {
    var names = [], // Name of methods for autocomplete
        pipes = [], // Name of pipes for autocomplete
        checkTimer = null,
        that = this; // Keep this reference

    function updateAutocomplete(obj)
    {
        var name = obj.name, src = obj.source, tgt = obj.target;
        if (name && !names.includes(name)) names.push(name);
        if (src && !names.includes(src)) names.push(src);
        if (tgt && !names.includes(tgt)) names.push(tgt);
        var pipe = obj.pipe,
            alias = NanoProject.pipeAlias(pipe);
        pipes[pipe] = (alias) ? alias : pipe;
    }

    this.init = function(result)
    {
        console.log(`Nanoware init: ${Object.values(result).length} channels!`);
        names.length = 0;
        pipes.length = 0;
        Object.values(result).forEach(o => 
        {
            updateAutocomplete(o);
        });
        NanoPkgs.init();
        flowView.init();
        clearInterval(checkTimer);
        checkTimer = setInterval(this.checkInterval, 10*1000);
    }
    this.onNanoMsg = function(o)
    {
        if (o.nodes)
        {
            o.nodes.forEach((node) => {
                Nanobrain.hash(node);
                node.ObjectKind = "";
                if (this.onChannel(node))
                {
                    flowView.onChannel(node);
                }
            });
        }
        this.onChannel(o);
    }
    this.onChannel = function(obj)
    {
        var p = NanoProject.getProject();
        var channel = obj.channel;
        if (obj.active == false)
        {
            if (p.channels[channel])
            {
                delete p.channels[channel];
                NanoProject.update();
            }
            flowView.onDeleteChannel(obj);
            return;
        }
        if (p.channels[channel] == undefined)
        {
            obj.stats = {};
            // Add the channel to the project db
            p.channels[channel] = obj;
            NanoProject.update();
            // Update the methods/pipes search autocomplete
            updateAutocomplete(obj);
        }
        
        // Get the channel object from the cache (can update fields from obj to this object)
        var o = p.channels[channel];

        // Check if channel is muted - return false if muted so other layers won't get the message
        if (o.mute === true) return;

        // Update some fields
        o.currentTrail = obj.currentTrail;
        o.pipe = obj.pipe;

        var stats = o.stats;

        const now = new Date().getTime();

        //Record a timestamp for the message
        let previousTS = stats.timestamp || now;
        stats.timestamp = now;

        let maxTS = stats.tmax || 0;
        let minTS = stats.tmin || Number.MAX_SAFE_INTEGER;

        //How many messages passed through this channel since app start....
        stats.count = stats.count ? stats.count + 1 : 1;

        stats.sinceLast = now - previousTS;

        //Determine MAX time passed between messages...
        if (stats.sinceLast > maxTS) maxTS = stats.sinceLast;
        stats.tmax = maxTS;

        //Determine MIN time passed between messages...
        if (stats.sinceLast < minTS) minTS = stats.sinceLast;
        stats.tmin = minTS;

        //Determine the average....currently the middle between the max and the min - TODO - implement a better alg
        stats.tavg = (stats.tmax + stats.tmin) / 2.0;

        //Calculate how many messages per second or per minute....
        if (stats.count % 10 == 0) {
            if (!stats.mark10) stats.mark10 = stats.timestamp;
            else {
                let since10 = stats.mark10;
                stats.mark10 = stats.timestamp;

                //Calculate rate of messages per sec
                let secElapsed = (stats.mark10 - since10) / 1000;
                if (secElapsed) {
                    stats.rateInSec = 10 % secElapsed;
                    stats.rateInMin = stats.rateInSec * 60;
                }
            }
        }

        // Checks
        performChecks(channel, false);
        // Update the view
        flowView.onChannel(obj);
    }
    this.checkInterval = function()
    {
        if (!NanoProject.isOpen()) return;
        var checks = NanoProject.getChecks();
        Object.keys(checks).forEach(key => performChecks(key, true) );
    }
    this.getNames = function()
    {
        return names;
    }
    this.getPipes = function()
    {
        return Object.values(pipes);
    }

    // This function is called per Channel to perform the checks. Add here the function/variables to expose as API
    function performChecks(name, global)
    {
        if (!NanoProject.isOpen()) return;
        var checks = NanoProject.getChecks();
        var channel = NanoProject.getChannel(name);
        var check = checks[name];
        var stats   = channel.stats;
        function expired(timeout) {
            let elapsed = (new Date().getTime() - channel.stats.timestamp) / 1000;
            return elapsed > timeout;
        }
        function warn(data) { NanoAlarm.add(name, "Warning", data); }
        function notify(data) { NanoAlarm.add(name, "Notification", data); }
        function alarm(data) { NanoAlarm.add(name, "Critical", data); }
        if (check)
        {
            check.forEach(function(e) {
                if (e.disabled) return;
                try
                {
                    if (e.global == global)
                    {
                        eval(e.eval);
                    }
                }
                catch(e)
                {
                    console.log(e.message);
                }
            });
        }
    }
}


