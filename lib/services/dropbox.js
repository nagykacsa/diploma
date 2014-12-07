var rest = require("restler");

module.exports = {
	getToken : function(params, cb) {		
		var url = "https://api.dropbox.com/1/oauth2/token?"+
					"code="+params.code+
					"&grant_type=authorization_code"+
					"&client_id="+params.client_id+
					"&client_secret="+params.client_secret+
					"&redirect_uri="+params.redirect_uri
		
		rest.post(url).on('complete',function(data){
			cb(data);
		});
	},
	
	getFile: function(url, token, cb){
		rest.get(url+"?access_token="+token).on("complete",function(file){
			cb(file);
		});
	}
}