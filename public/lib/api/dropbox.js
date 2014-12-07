define([ 'plugins/router', 'durandal/app', 'jquery', 'util', 'dbapi/dropbox' ], function(router, app, $, util, dropbox) {
	var config = {
		client_id : "z47xwqxo4mfsbnh",
		secret : "juzfywgw40reqym",
		api_url : "https://api.dropbox.com/1",
		oauth_url: "https://www.dropbox.com/1/oauth2",
		redirect_uri : "http://localhost:10001",
	};
	
	var user = {};
	var allFolders = [];
	var rootId = 0;
	var client = {};
	
	var login = function() {
		var exp = new Date().getTime() + 300000;
		document.cookie = 'actual=dropbox;expires='+ exp;

		var url = config.oauth_url + "/authorize?" +
					"response_type=code" +
					"&client_id="+config.client_id +
					"&redirect_uri="+config.redirect_uri;
		
		window.location = url;		
	};

	var authorize = function(){	
		if(util.query().code && util.getCookie('actual') == 'dropbox'){
			$.ajax({
				method: "GET",
				url: "/getDropboxToken",
				data: {code: util.query().code,
					grant_type: "authorization_code",
					client_id: config.client_id,
					client_secret: config.secret,
					redirect_uri: config.redirect_uri,
					uri: "https://api.dropbox.com/1/oauth2"}
			}).success(function(data){
				document.cookie = 'dropbox_token=' + data;
				util.removeParamsFromUrl();
			}).error(function(){
				
			});
		}
	};
	
	var getToken = function(){
		try {
			var token = JSON.parse(util.getCookie("dropbox_token"));
			return token;
		} catch(e) {
			return null;
		}
	};
	
	var getAuthorized = function(){
		if(getToken()){
			return true;
		}
		return false;
	};
	
	var getClient = function(){
		if(getToken() != null){
			if(client != {}){
				client = new Dropbox.Client({ 
					key: config.client_id,
					secret: config.secret,
					sandbox: false,
					token: getToken().access_token
				});
			}
			return client;
		}
	};
	
	var getUserInfo = function(cb){
		if(getToken() != null){
			getClient().getAccountInfo(function (error, info) {
			    user = info;
			    cb(true);
			});
		}
	};
	
	var logout = function(){
		util.deleteCookie("dropbox_token");
	};
	
	var listFiles = function(folder, cb){
		if ((!cb) && (typeof folder === 'function')) {
			cb = folder;
			folder = "/";
		}
		
		getClient().readdir(folder, function(error, entries, stat, entry_stats){
			for(var i=0;i<entry_stats.length;i++){
				entry_stats[i].service = "dropbox";
				
			}
			cb(entry_stats, stat);
		});
	};
	
	var getFolders = function(){
		return allFolders;
	}
	
	var downloadItem = function(item, cb){		
		getClient().makeUrl(item.path,{download: true,downloadHack: false},function(error,url){
			if(!error){
				cb(url.url);
			}
		});
	};
	
	var deleteItem = function(item, cb){
		getClient().remove(item.path, function(error,stat){
			cb(error, stat);
		});
	};
	
	var getUser = function(){
		return user;
	};
	
	var upload = function(path, file, options, cb){
	    getClient().writeFile(path, file, options, function(error,file){
	    	cb(error,file);
	    });
	};
	
	var getRootId = function(){
		return rootId;
	};
	
	var moveFile = function(data, path, cb){
		var self = this;
		util.getFile(data, function(file, name){
			if(!file){
				cb("dir",name);
			}
			self.upload(path+"/"+name,file,{},function(error, newFile){
				cb(error,newFile);
			});
		});
	};
	
	var otherServices = function(){
		return util.otherServices("dropbox");
	};
	
	var dropbox = {
		title : "Dropbox API",
		login : login,
		authorize: authorize,
		getUserInfo: getUserInfo,
		listFiles: listFiles,
		downloadItem: downloadItem,
		deleteItem: deleteItem,
		getUser: getUser,
		//getFolders: getFolders,
		upload: upload,
		getRootId: getRootId,
		logout: logout,
		moveFile: moveFile,
		otherServices: otherServices
	};

	return dropbox;
});