var app = null;
var config = require('config').cfg();
var path = require('path');

/**
 * Server initialization and run it.
 * 
 * @param {Config}
 *            config
 * @param {String}
 *            env
 * @function
 * @returns {app}
 */
if (app === null) {
    app = initApp();
}
module.exports = app;

function initApp() {
    /**
     * @requires express, gzippo, url, i18n, connect-mongo
     */
    var express = require('express');
    var gzippo = require('gzippo');
    var url = require('url');
    //var i18n = require("i18n");
    var os = require('os');
    //var MongoStore = require('connect-mongo')(express);
    //var https = require('https');
    var fs = require('fs');;

    var options = {
        key: fs.readFileSync('./keys/diploma.key'),
        cert: fs.readFileSync('./keys/diploma.crt'),
        requestCert: false,
        rejectUnauthorized: false
    };


    //var app = express();

    //var server = https.createServer(options, app);
    
    var app = express.createServer();

    /*if(config.get("server") && config.get("server").get("process") && config.get("server").get("process").get("title")){
        process.title = config.get("server").get("process").get("title");
    }*/
    
    process.title = config.server.title;

    app.configure(function() {

        setViews(app);
        //i18nConfig(app, i18n);
        // contentFor & content view helper - to include blocks of content only
        // on
        // required pages
        app.use(function(req, res, next) {
            // expose the current path as a view local
            res.local('path', url.parse(req.url).pathname);

            /* Globális beállítás erre kellene még */
            /*if (req.query.lang != "undefined") {
                i18n.setLocale(req.query.lang);
            }*/

            // assign content str for section
            res.local('contentFor', function(section, str) {
                res.local(section, str);
            })

            // check if the section is defined and return accordingly
            res.local('content', function(section) {
                if (typeof res.local(section) != 'undefined') {
                    return res.local(section);
                } else {
                    return '';
                }
            })
            req.agent = false;
            next();
        });

        // bodyParser should be above methodOverride
        app.use(express.bodyParser({
            uploadDir : os.tmpDir() //TODO config
        }));

        app.use(express.methodOverride());

        // cookieParser should be above session
        app.use(express.cookieParser());

        /*exports = mongoStore = new MongoStore({
            url : config.db.protocol + "://" + config.db.host + ":" + config.db.port + "/", //TODO config
            db : config.db.dbname
        });*/

        app.use(express.session({
            secret : config.server.secret,
            //store : mongoStore
        }));

        //app.use(express.logger(':method :url :status'));
        //Change app favicon (icon on browser tab)
        //app.use(express.favicon(path.join(__dirname,"..","..","smile.ico")));
        app.use(express.favicon());

        // setting environment
        app.use(gzippo.staticGzip(path.join(__dirname, '..', '..','public'))); //TODO config
        
        if(config.server.compress){
        	app.use(gzippo.compress());
        } else {
        	app.enable('view cache');
        }
    });

    /*app.helpers({
        __i : i18n.__,
        __n : i18n.__n
    });*/

    // Some dynamic view helpers
    app.dynamicHelpers({

        base : function() {
            return '/' == app.route ? '' : app.route; // return the app's
            // mount-point so that urls
            // can adjust.
        },
        appName : function(req, res) {
            return config.server.title;
        },
        slogan : function(req, res) {
        	return config.server.title;
        }
    });

    // Don't use express errorHandler as we are using custom error handlers
    app.use(express.errorHandler({
        dumpExceptions : false,
        showStack : false
    }));

    // show error on screen. False for all envs except development
    // settmgs for custom error handlers
    app.set('showStackError', false);

    return app;
}

function setViews(app) {
    // set views path, template engine and default layout
    app.set('view engine', 'html');
    app.register('.html', require('thunder'));

    app.set('views', path.join(__dirname, '..', '..','lib','views')); //TODO config
    app.set('view options', {
        compress : false,
        layout: false
    });
}
/*
function i18nConfig(app, i18n) {
    var i18nConfig = config.get('i18n').toJson(); //TODO config
    i18nConfig.register = global;
    i18n.configure(i18nConfig);

    app.use(i18n.init);
}
*/