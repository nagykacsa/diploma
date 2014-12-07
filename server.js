var app = require('./lib/init/express');
var config = require('config').cfg();
var io = require('socket.io').listen(10002);
require('./lib/controllers')(app);
require('./lib/sockets')(io);

app.listen(config.server.port);

console.log("Express server listening on port %d", app.address().port);