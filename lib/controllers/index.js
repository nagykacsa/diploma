//var config = require('config');
var path = require('path');

module.exports = function(app) {
    var files = [
                 'apis',
                 'view'
                 ];
    
    var controllers_path = __dirname;//TODO config
    for( var i=0;i<files.length;i++){
        require(path.join(controllers_path, files[i] + '.js'))(app);
    }
};