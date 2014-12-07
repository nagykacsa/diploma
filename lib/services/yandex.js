var rest = require("restler");
var config = require("config").cfg();
var yandex = require("yandex-disk");

module.exports = {
		getUserInfo : function(token,cb) {		
		var url = "https://webdav.yandex.com/?userinfo";
		
		rest.get(url, {
			headers:{Authorization: "OAuth "+token}
		}).on('complete',function(data){
			cb(data);
		});
	},
	
	upload: function(url, content, token, cb){
		var disk = new yandex.YandexDisk(token);
		
		url = url.split("disk:/")[1];
		
		disk.writeFile(url, content, 'Base64', function(err) {
            if (err) {
            	cb(err, false);
            }
            disk.exists (url, function(err, exists) {
            	cb(err, exists);
            });
        });
	},
	
	getFile: function(path, token, cb){
		var disk = new yandex.YandexDisk(token);
		
		path = path.split("disk:/")[1];
		
		disk.readFile(path, "base64", function(err, content) {
			var buf = new Buffer(content, 'base64');
            cb(buf);            
        });
	}
}