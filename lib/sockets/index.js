//var config = require('config');
var path = require('path');

module.exports = function(io) {
    io.sockets.on('connection', function(socket) {    	
        var files = [
                       'main',
                       ];
        var ms_path = __dirname; //TODO config
        for(var i=0;i<files.length;i++){
        	require('./' + files[i] + '.js')(socket);
        }
    });
}