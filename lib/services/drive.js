var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var config = require("config").cfg();

var oauth2Client = new OAuth2(
		config.api.google.client_id,
		config.api.google.secret,
		config.api.google.redirect_uri);

var token = null;

module.exports = {
	getAuthUrl : function() {
		var url = oauth2Client.generateAuthUrl({
			access_type : 'offline', // 'online' (default) or 'offline' (gets refresh_token)
			scope : config.api.google.scopes, // If you only need one scope you can pass it as string
			approval_prompt: "force"
		});
		return url;
	},

	getToken : function(code, cb) {
		oauth2Client.getToken(code, function(err, tokens) {
			if (!err) {
				cb(tokens);
			}
		});
	},

	refreshToken : function(token, cb) {
		oauth2Client.setCredentials(token);
		oauth2Client.refreshAccessToken(function(err, tokens) {
			if (!err) {
				cb(tokens);
			}
		});
	}
}