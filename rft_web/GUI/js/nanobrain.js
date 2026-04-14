
function reducer(state = {},action) {
    //console.log(action.type);
    if (action.transition)
        return action.transition(state);
    return state;
}

//var Store = Redux.createStore(reducer,window.__REDUX_DEVTOOLS_EXTENSION__ &&
//window.__REDUX_DEVTOOLS_EXTENSION__({ serialize: true, trace: true }));
/*
function counter(state, action) {
    if (typeof state === "undefined") {
      return 0;
    }

    switch (action.type) {
      case "INCREMENT":
        return state + 1;
      case "DECREMENT":
        return state - 1;
      default:
        return state;
    }
  }

  var store = Redux.createStore(
    counter,
    window.__REDUX_DEVTOOLS_EXTENSION__ &&
      window.__REDUX_DEVTOOLS_EXTENSION__({ serialize: true, trace: true })
  );
*/

function configureStore(preloadedState) {
    const enhancer = window.__REDUX_DEVTOOLS_EXTENSION__ &&
      window.__REDUX_DEVTOOLS_EXTENSION__({ serialize: true, trace: true });
    //const enhancer = window.devToolsExtension && window.devToolsExtension();

    if (!enhancer) {
      console.warn('Install Redux DevTools Extension to inspect the app state: ' +
        'https://github.com/zalmoxisus/redux-devtools-extension#installation')
    }
  
    const store = Redux.createStore(reducer,window.__REDUX_DEVTOOLS_EXTENSION__ &&
        window.__REDUX_DEVTOOLS_EXTENSION__({ serialize: true, trace: true }));
    //const store = (window.devToolsExtension ? window.devToolsExtension()(Redux.createStore) : Redux.createStore)(reducer, preloadedState)
    /*if (module.hot) {
      // Enable Webpack hot module replacement for reducers
      module.hot.accept('../reducers', () => {
        store.replaceReducer(require('../reducers').default)
      });
    }*/
  
    return store;
  }

var Store = null; 

const parseArg = (arg,delim,obj) => {
    let nameAt = arg.lastIndexOf(delim);
    if (nameAt > 0) {
        obj[arg.substring(nameAt + 1)] = arg.substring(0,nameAt);
        return true;
    }
    return false;

}

const objectFromArgs = (args) => {
    let obj = {};
    //let sig = args.split(",");
    args.forEach((arg) => {
        if (parseArg(arg," ",obj)) return;
        if (parseArg(arg,"]",obj)) return;
        if (parseArg(arg,">",obj)) return;
    });

    return obj;
}

var Nanobrain = {
    //Target sent a nano-msg to us, decipher and return
    //an object for rendering....
    input: nano_msg =>
    {
        try
        {
            var vnode = nano_msg
            Nanobrain.hash(vnode);
            if (vnode.type == "nano_msg")
            {
                if (!vnode.target) vnode.target = vnode.channel + "TGT";
                Nanoware.onNanoMsg(vnode);
            }
            else if (vnode.type == "nano_sensor")
            {
                sensorsDb.onSensor(vnode);
            }
            else if (vnode.type == "nano_file")
            {
                codeEditor.onFile(vnode);
            }
            else if (vnode.type == "nano_branch")
            {
				flowView.onBranch(vnode);
            }
            else if (vnode.type == "nano_response")
            {
                codeEditor.log(vnode.response);
				//console.log(vnode);
            }
            else if (vnode.type == "nano_trigger")
            {
                flowView.onTrigger(vnode);
            }
            else if (vnode.type == "nano_package")
            {
                NanoPkgs.onPackage(vnode);
            }
			else if (vnode.type == "nano_test")
            {
                recordView.onTest(vnode);
            }
            else if (vnode.type == "nano_error")
            {
                NanoAlarm.add(vnode.name, "Error", vnode.payload);
            }
            else
            {
                console.log(vnode);
            }
        }
        catch (e)
        {
            console.log(e);
            console.log(nano_msg);
        }
    },
	hash: o =>
	{
        o.name = o.channel;
        o.srcHash = o.sourcePkg+o.source;
        o.tgtHash = o.targetPkg+o.target;
        o.channel = (o.filename) ? o.filename.replace(/[().,\[\]]/g, '') : "no_hash";
	}
};
