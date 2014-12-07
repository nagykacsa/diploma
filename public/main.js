requirejs.config({
    paths : {
        'text' : '/lib/require/text',
        'durandal' : '/lib/durandal',
        'plugins' : '/lib/durandal/plugins',
        'transitions' : '/lib/durandal/transitions',
        'knockout' : '/lib/knockout/knockout-3.1.0',
        'bootstrap' : '/lib/bootstrap/bootstrap.min',
        'jquery' : '/lib/jquery/jquery-1.11.0.min',
        'io' : 'http://localhost:10002/socket.io/socket.io',
        'jquery-ui' : '/lib/jquery-ui/jquery-ui-1.10.4.custom.min',
        'api': '/lib/api',
        'util': '/lib/util',
        'ko-switch-case': '/lib/knockout-switch-case/knockout-switch-case.min',
        'zipjs': '/lib/zipjs/WebContent',
        /*'gapi': '/lib/gapi/gapi',*/
        'dbapi': "/lib/dropbox-js",
        'kodragdrop': "/lib/knockout-dragdrop/lib/knockout.dragdrop",
        'wlapi': "//js.live.net/v5.0/wl",
    },
    shim : {
        'bootstrap' : {
            deps : [ 'jquery' ],
            exports : 'jQuery'
        }
    }
});

define([ 'durandal/system', 'durandal/app', 'durandal/viewLocator', 'io' ], function(system, app, viewLocator, io) {
    //>>excludeStart("build", true);
    system.debug(false);
    
    //>>excludeEnd("build");

    app.title = 'Diploma';

    app.configurePlugins({
        router : true,
        dialog : true,
        widget : true,
        observable : true

    });

    app.start().then(function() {
        //Replace 'viewmodels' in the moduleId with 'views' to locate the view.
        //Look for partial views in a 'views' folder in the root.
        viewLocator.convertModuleIdToViewId = function(str) {
        	
            return str.replace("viewModel/", "views/");
        }
        
        socket = io.connect("http://localhost:10002");
        
        app.setRoot('modul/shell/index', 'entrance', $("body")[0]);

    });

});