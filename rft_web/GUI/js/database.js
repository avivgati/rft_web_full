
var NanoDb = new function() {
    var that = {},
        db,
        dbName = "Nanoware",
        PROJECTS_STORE = "NanoProjects",
        projectNames = {}, settings;

    that.init = function()
    {
        let promise = new Promise(function(resolve, reject)
        {
            //check for support
            if (!('indexedDB' in window)) {
                //console.log('This browser doesn\'t support IndexedDB');
                reject("indexedDB not supported");
            }

            var request = indexedDB.open(dbName, 2);
            request.onerror = function (event) {
                reject("Error opening DB - "+request.error);
            };
			var dbSize = 0;
            request.onsuccess = function (event) {
                console.log("opened!");
                db = request.result;
                var res = [];
                //console.log('The database is opened successfully');
                that.readAll((o) =>
                {
                    if (o)
					{
						var json = JSON.stringify(o);
						dbSize += json.length;
						res.push(o);
					}
                    if (o === undefined) return;
                    if (o === null)
                    {
                        validateSettings();
						NanoLic.setDbSize(dbSize);
                        resolve(res);
                    }
                });
            };
            request.onupgradeneeded = function(event) {
                db = event.target.result;
                console.log("upgrading DB");
                var objectStore;
                if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
                    objectStore = db.createObjectStore(PROJECTS_STORE,  {keyPath:"id", autoIncrement:true});
                    objectStore.createIndex('name', 'settings.name', { unique: false });
                }
                console.log("upgrade done!");
            }
        });
        return promise;
    }
    function validateSettings()
    {
        if (!settings) settings = { isSettings: true };
        if (!settings.recent) settings.recent = [];
        if (!settings.general) settings.general = {};
        if (!settings.graph) settings.graph = {};
    }
    that.getSettings = () =>
    {
        return settings;
    }
    that.updateSettings = (key, value) =>
    {
        if (key) settings[key] = value;
        that.update(settings);
    }
    that.addRecent = (id) =>
    {
        var recent = settings.recent,
            n = recent.indexOf(id);
        if (n != -1) recent.splice(n, 1);
        if (recent.unshift(id) > 3) recent.length = 3;
        that.updateSettings();
    }
    that.clearRecent = () =>
    {
        settings.recent = [];
        that.updateSettings();
    }
	that.projectExist = (name) =>
	{
		return projectNames[name] == true;
	}
    that.deleteDb = () =>
    {
        db.close();
        var req = indexedDB.deleteDatabase(dbName);
        req.onsuccess = function () {
            console.log("Deleted database successfully");
        };
        req.onerror = function () {
            console.log("Couldn't delete database");
        };
        req.onblocked = function () {
            console.log("Couldn't delete database due to the operation being blocked");
        };
    }
    that.openProject = function(name)
    {
        let promise = new Promise(function(resolve, reject)
        {
            if (!projectNames[name])
            {
                var proj = {};
                that.validateProject(proj);
                resolve(proj);
            }
            else
            {
                var cursorRequest = db.transaction(PROJECTS_STORE, 'readwrite')
                                .objectStore(PROJECTS_STORE)
                                .index('name')
                                .openCursor(IDBKeyRange
                                .only(name));
                cursorRequest.onsuccess = e => {
                    var cursor = e.target.result;
                    if (cursor)
                    {
                        var proj = cursor.value;
                        that.validateProject(proj);
                        resolve(proj);
                        return;
                        //cursor.continue();
                    }
                }
                cursorRequest.onerror = function (event) {
                    reject(false);
                }
            }
        });
        return promise;
    }
    that.validateProject = function(p)
    {
        if (!p.settings) p.settings = {name: "New Project", ip: "localhost", port: "8889"};
        if (!p.settings.filters) p.settings.filters = {};
        if (!p.data) p.data = {};
        if (!p.data.groups) p.data.groups = {};
        if (!p.data.pipeAlias) p.data.pipeAlias = {};
        if (!p.data.checks) p.data.checks = {};
        if (!p.data.tests) p.data.tests = {};
        if (!p.data.activity) p.data.activity = {};
		if (!p.data.activity.filters) p.data.activity.filters = "";
        if (!p.data.activity.triggerStart) p.data.activity.triggerStart = {};
        if (!p.data.activity.triggerStop) p.data.activity.triggerStop = {};
        if (!p.data.activity.list) p.data.activity.list = {};
		if (!p.data.activity.pipes) p.data.activity.pipes = {};
        if (!p.data.activity.softTrigger) p.data.activity.softTrigger = "";
        if (!p.data.activity.watchTrigger) p.data.activity.watchTrigger = "";
        if (!p.data.injects) p.data.injects = {};
        if (!p.channels) p.channels = [];
    }
    that.add = function(settings)
    {
        var name = settings.name;
        if (projectNames[name]) return null;
        let promise = new Promise(function(resolve, reject)
        {
            if (!name)
            {
                reject(false);
                return;
            }
            var project = { settings: settings };
            that.validateProject(project);
            var request = db.transaction([PROJECTS_STORE], 'readwrite')
                            .objectStore(PROJECTS_STORE)
                            .add(project); // Add item if not exist only

            request.onsuccess = function (event) {
                projectNames[name] = true;
                resolve(true);
            };

            request.onerror = function (event) {
                reject(false);
            }
        });
        return promise;
    }
    that.delete = function(name)
    {
        var cursorRequest = db.transaction(PROJECTS_STORE, 'readwrite')
                            .objectStore(PROJECTS_STORE)
                            .index('name')
                            .openCursor(IDBKeyRange
                            .only(name));
        cursorRequest.onsuccess = e => {
            projectNames[name] = undefined;
            var cursor = e.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        }
    }
	that.eraseChannels = (name) =>
	{
		NanoDb.openProject(name)
        .then(
            result => {
				result.channels = [];
				that.update(result);
            },
        );
	}
	that.erasePipeAlias = (name) =>
	{
		NanoDb.openProject(name)
        .then(
            result => {
				result.data.pipeAlias = {};
				that.update(result);
            },
        );
	}
	that.eraseActivity = (name) =>
	{
		NanoDb.openProject(name)
        .then(
            result => {
				result.data.activity = {};
				that.validateProject(result);
				that.update(result);
            },
        );
	}
    that.eraseInjects = (name) =>
	{
		NanoDb.openProject(name)
        .then(
            result => {
				result.data.injects = {};
				that.validateProject(result);
				that.update(result);
            },
        );
	}
	that.eraseData = (name) =>
	{
		NanoDb.openProject(name)
        .then(
            result => {
				result.channels = [];
				result.data = {};
				that.validateProject(result);
				that.update(result);
            },
        );
	}
    that.export = function(name)
    {
        var cursorRequest = db.transaction(PROJECTS_STORE, 'readwrite')
                            .objectStore(PROJECTS_STORE)
                            .index('name')
                            .openCursor(IDBKeyRange
                            .only(name));
        cursorRequest.onsuccess = e => {
            var cursor = e.target.result;
            if (cursor) {
                var proj = cursor.value;
                var fileName = name+".nano",
                    a = document.createElement("a"),
                    json = JSON.stringify(proj),
                    blob = new Blob([json], {type: "text/plain;charset=" + document.characterSet}),
                    url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = fileName;
                var event = document.createEvent("MouseEvents");
                event.initMouseEvent(
                    "click", true, false, window, 0, 0, 0, 0, 0
                    , false, false, false, false, 0, null
                );
                a.dispatchEvent(event);
                cursor.continue();
            }
        }
    }
    that.rename = function(oldName, settings)
    {
        var name = settings.name;
        // Check if some1 is trying to change a project name to an already existing name
        if ((oldName !== name) && projectNames[name]) return false;
        db.transaction(PROJECTS_STORE, 'readwrite')
        .objectStore(PROJECTS_STORE)
        .index('name')
        .openCursor(IDBKeyRange
        .only(oldName))
        .onsuccess = e => {
            var cursor = e.target.result;
            if (cursor) {
                projectNames[oldName] = undefined;
                projectNames[name] = true;
                var proj = cursor.value;
                proj.name = name;
                proj.settings = settings;
                cursor.update(proj);
                cursor.continue();
            }
        }
        return true;
    }
    that.update = function(p)
    {
        var request = db.transaction([PROJECTS_STORE], 'readwrite')
            .objectStore(PROJECTS_STORE)
            .put(p); // Update existing item

        request.onsuccess = function (event) {
            //onsole.log('The data has been written successfully');
        };

        request.onerror = function (event) {
            //console.log('The data has been written failed');
        }
    }
    that.readAll = function(callback)
    {
        db.transaction(PROJECTS_STORE)
        .objectStore(PROJECTS_STORE)
        .openCursor().onsuccess = e => {
            var cursor = e.target.result;
            if (cursor)
            {
                try
                {
                    var proj = cursor.value;
                    if (proj.isSettings)
                        settings = proj;
                    else
                    {
                        projectNames[proj.settings.name] = true;
                        callback(proj);
                    }
                }
                catch(e)
                {
                    console.log(e);
                }
                cursor.continue();
            } else {
                callback(null);
            }
        };
    }
    return that;
};