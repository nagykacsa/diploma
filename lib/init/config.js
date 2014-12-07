var path = require('path');
var config = require('config');
var os = require('os');

/**
 * The configuration initialization.
 * 
 * @param {String}
 *            env application environment
 * @param {String}
 *            [configFile] application config
 * @param {Object}
 *            [overWrite] overwrite application environment (from argument)
 * @function
 * @returns {config}
 */

module.exports = function initConfig(env, configFile, overWrite) {

    *//**
     * The application production config file.
     * 
     * It is the default application config. If the envirovent not equal with it
     * then it will be overwrite.
     * 
     * @type {string}
     *//*

    var defaultConfig = path.join(__dirname, '..', '..', 'config',
            'default.yaml');

    config.setEnvironment('APPLICATION_PATH', path.join(__dirname, '..', '..'));
    config.setEnvironment('TEMP_PATH', os.tmpdir());
    config.loadConfig(defaultConfig);

    if (env && !configFile && env != 'production') {
        config.loadConfig(path.join(config.getEnvironment('APPLICATION_PATH'),
                'config', env + '.yaml'));
    }

    // if we give -p parameter
    if (overWrite != null) {
        for ( var key in overWrite) {
            config.get('server').set('port', overWrite[key]);
        }
    }
    
    return config;
}

