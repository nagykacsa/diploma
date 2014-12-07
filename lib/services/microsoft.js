var config = require("config").cfg();
var rest = require("restler");

module.exports = {
	getAuthUrl : function() {
		var url = config.api.microsoft.oauth_url + "/oauth20_authorize.srf?" +
				"client_id="+config.api.microsoft.client_id +
				"&scope="+config.api.microsoft.scopes +
				"&response_type=code" +
				"&redirect_uri="+config.api.microsoft.redirect_uri;		
		return url;
	},

	getToken : function(code, cb) {		
		var url = config.api.microsoft.oauth_url + "/oauth20_token.srf?" +
		"client_id="+config.api.microsoft.client_id +
		"&redirect_uri="+config.api.microsoft.redirect_uri +
		"&client_secret="+config.api.microsoft.secret +
		"&code="+code +
		"&grant_type=authorization_code";
		
		rest.get(url, {}).on('complete', function(token) {
			cb(token);
        });
	},

	refreshToken : function(token, cb) {
		var url = config.api.microsoft.oauth_url + "/oauth20_token.srf?" +
		"client_id="+config.api.microsoft.client_id +
		"&redirect_uri="+config.api.microsoft.redirect_uri +
		"&client_secret="+config.api.microsoft.secret +
		"&refresh_token="+token.refresh_token +
		"&grant_type=refresh_token";
		
		rest.get(url, {}).on('complete', function(token) {
			cb(token);
        });
	}
}