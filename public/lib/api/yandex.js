define([ 'plugins/router', 'durandal/app', 'jquery', 'util'], function(router, app, $, util) {
	var config = {
		client_id : "e861195b4e1a4002b6fd496b75eb477e",
		secret : "ab2091015c074d79a1774065c4215de8",
		api_url : "https://cloud-api.yandex.net/v1/disk/resources",
		oauth_url: "https://oauth.yandex.com/authorize",
		redirect_uri : "http://localhost:10001",
	};
	
	var user = {};
	var allFolders = [];
	var rootId = 0;
	var client = {};
	
	var login = function() {
		var exp = new Date().getTime() + 300000;
		document.cookie = 'actual=yandex;expires='+ exp;

		var url = config.oauth_url + "?response_type=token&client_id="+config.client_id+"&display=popup";
		window.location.href = url;
	};

	var authorize = function(){
		if(window.location.hash && util.getCookie('actual') == 'yandex'){
			var tokenStr = window.location.hash.split("#")[1];
			var tokenElement = tokenStr.split("&");
			
			var token = {
					access_token: tokenElement[0].split("=")[1],
					token_type: tokenElement[1].split("=")[1],
					expires_in: tokenElement[2].split("=")[1]
			}
			var expires = new Date(new Date().getTime() + token.expires_in*1000);
			token.expires_in = expires.getTime();
			
			document.cookie = 'yandex_token=' + JSON.stringify(token) + "; expires=" + expires;
			
			window.location.hash = "";
			location.reload();
		}
	};
	
	var getToken = function(){
		try {
			var token = JSON.parse(util.getCookie("yandex_token"));
			return token;
		} catch(e) {
			return null;
		}
	};
	
	var validateToken = function(cb){	
		try {
			var token = JSON.parse(util.getCookie("yandex_token"));
			var expires = token.expires_in;
			var now = new Date().getTime();			
			
			if(expires < now){
				login();
			}
		} catch(e){
		}
	};
	
	var getAuthorized = function(){
		if(getToken()){
			return true;
		}
		return false;
	};
	
	var getUserInfo = function(cb){
		if(getToken() != null){					
			$.ajax({
				method: "GET",
				url: "/yandexUserinfo",
				data: {token: getToken().access_token}
			}).done(function(info){
				var name = info.split(":")[1];
				cb({name: name});
			}).error(function(e){
			});
		} else {
			validateToken();
		}
	};
	
	var logout = function(){
		util.deleteCookie("yandex_token");
	};
	
	var listFiles = function(folder, cb){
		if ((!cb) && (typeof folder === 'function')) {
			cb = folder;
			folder = "disk:";
		}
		
		if(getToken() != null){
			$.ajax({
				method: "GET",
				url: config.api_url,
				data: {
					path: folder
				},
				headers: {Authorization: "OAuth "+getToken().access_token}
			}).done(function(files){
				for(var i=0;i<files._embedded.items.length;i++){
					files._embedded.items[i].service = "yandex";
				}
				
				cb(files._embedded.items, files);
			}).error(function(e){
				if(e.status == "401"){
					validateToken();
				}
			});
		} else {
			validateToken();
		}
	};
	
	var getFolders = function(){
		return allFolders;
	}
	
	var downloadItem = function(item, cb){		
		if(getToken() != null){
			$.ajax({
				method: "GET",
				url: config.api_url + "/download",
				headers: {Authorization: "OAuth "+getToken().access_token},
				data: {
					path: item.path
				}
			}).done(function(url){
				cb(url.href);
			}).error(function(e){
				if(e.status == "401"){
					validateToken();
				}
			});
		} else {
			validateToken();
		}
	};
	
	var deleteItem = function(item, cb){
		if(getToken() != null){
			$.ajax({
				method: "DELETE",
				url: config.api_url + "?path="+item.path+"&permanently=true",
				headers: {Authorization: "OAuth "+getToken().access_token}
			}).done(function(resp){
				cb(resp);
			}).error(function(e){
				if(e.status == "401"){
					validateToken();
				}
			});
		} else {
			validateToken();
		}
	};
	
	var getUser = function(){
		return user;
	};
	
	var upload = function(path, content, cb){
		if(getToken() != null){
			util.sendAndReceive("yandexUpload", {url: path,content: content,token:getToken().access_token}, "yandexUploadResult"+path, function(result){
				cb(result.exist);
			});
		} else {
			validateToken();
		}
	};
	
	var getRootId = function(){
		return rootId;
	};
	
	var moveFile = function(data, path, cb){
		var self = this;
		util.getFile(data, function(file, name){
			cb(file,name);
		});
	};
	
	var otherServices = function(){
		return util.otherServices("yandex");
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