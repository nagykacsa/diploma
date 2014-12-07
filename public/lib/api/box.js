define([ 'plugins/router', 'durandal/app', 'jquery', 'util'], function(router, app, $, util) {
	var config = {
		client_id : "2dx9ltjge8uya4q1n7suee60pmlriwcj",
		secret : "XVtFoZNFgRMKQmOmaZZ6Y9bO1fUPHN1v",
		api_url : "https://api.box.com/2.0",
		oauth_url: "https://app.box.com/api/oauth2",
		upload_url: "https://upload.box.com/api/2.0",
		redirect_uri : "http://localhost:10001",
		state: "o6SMUkXtA9QX9N9YANgKxt55j12OQw2s"
	};
	
	var user = {};
	var allFolders = [];
	var rootId = 0;
	var client = {};
	
	var login = function() {
		var exp = new Date(new Date().getTime() + 300000);
		document.cookie = 'actual=box;expires='+ exp;

		var url = config.oauth_url + "/authorize?response_type=code&client_id="+config.client_id+
				"&redirect_uri="+config.redirect_uri+
				"&state="+config.state;
		window.location.href = url;
	};

	var authorize = function(){
		if(util.query().code && util.getCookie('actual') == 'box'){
			$.ajax({
				method: "GET",
				url: "/getBoxToken",
				data: {
					code: util.query().code
				}
			}).success(function(data){
				if(!data.error){
					var exp = new Date(new Date().getTime() + data.expires_in*1000);
					data.expires_in = exp.getTime();
					
					document.cookie = 'box_token=' + JSON.stringify(data) + "; expires=" + exp;
					util.removeParamsFromUrl();
				}
			}).error(function(err){
				
			});
		}
	};
	
	var getToken = function(){
		try {
			var token = JSON.parse(util.getCookie("box_token"));
			return token;
		} catch(e) {
			return null;
		}
	};
	
	var validateToken = function(cb){	
		try {
			var token = JSON.parse(util.getCookie("box_token"));
			var expires = token.expires_in;
			
			var now = new Date().getTime();
			
			if(expires < now){
				refreshToken(token, function(refreshedToken){
					cb(refreshedToken);
				});
			} else {
				cb(token);
			}
		} catch(e){
			cb(null);
		}
	};
	
	var refreshToken = function(token, cb){
		$.ajax({
			method: "GET",
			url: "/refreshBoxToken",
			data: {token: token.refresh_token}
		}).success(function(data){
			var exp = new Date(new Date().getTime() + data.expires_in*1000);
			data.expires_in = exp.getTime();
			
			document.cookie = 'box_token=' + JSON.stringify(data) + "; expires=" + exp;
			cb(data);
		});
	};
	
	var getAuthorized = function(){
		if(getToken()){
			return true;
		}
		return false;
	};
	
	var getUserInfo = function(cb){
		validateToken(function(token){
			if(token != null){
				$.ajax({
					method: "GET",
					url: "/getBoxUser",
					data: {token: token.access_token}
				}).done(function(info){
					user = info;
					util.addUser("box",user);
					cb(info);
				}).error(function(e){
				});
			}
		});
	};
	
	var logout = function(){
		util.deleteCookie("box_token");
		util.removeUser("box");
	};
	
	var listFiles = function(folder, cb){
		if ((!cb) && (typeof folder === 'function')) {
			cb = folder;
			folder = {id: 0};
		}
		
		validateToken(function(token){
			if(token != null){
				$.ajax({
					method: "GET",
					url: "/getBoxFolder",
					data: {
						id: folder.id,
						token: token.access_token
					}
				}).done(function(data){
					for(var i=0;i<data.items.length;i++){
						data.items[i].service = "box";
					}
					
					var path = data.folder.path_collection.entries;
					data.folder.path = "/";
					for(var i=0;i<path.length;i++){
						if(path[i].id == 0){
							continue;
						}
						data.folder.path += path[i].name + "/";
					}
					
					if(data.folder.id != 0){
						data.folder.path += data.folder.name;
					}
					
					for(var i=0;i<data.items.length;i++){
	        			if(data.items[i].type != "folder" && data.items[i].type != "file"){
	        				data.items.splice(data.items[i], 1);
	        			}
	        		}
					
					cb(data.items, data.folder);
				}).error(function(e){
					
				});
			}
		});
	};
	
	var getFolders = function(){
		return allFolders;
	}
	
	var downloadItem = function(item, cb){	
		validateToken(function(token){
			if(token != null){
				$.ajax({
					method: "GET",
					url: "/getBoxFile",
					data: {
						token: token.access_token,
						item: item,
						email: user.login
					}
				}).done(function(content){
					cb(content);
				}).error(function(e){
					
				});
			}
		});
	};
	
	var deleteItem = function(item, cb){
		validateToken(function(token){
			if(token != null){				
				$.ajax({
					method: "DELETE",
					url: "/boxFile/"+item.id,
					headers: {Authorization: "Bearer "+token.access_token,
						"If-Match": item.etag},
					query: {type: item.type}
				}).done(function(resp){
					cb(resp);
				}).error(function(e){
				});
			}
		});
	};
	
	var getUser = function(){
		return user;
	};
	
	var upload = function(parent_id, content, fileData, cb){		
		validateToken(function(token){
			if(token != null){
				var data = {
					query: {
						content: content,
						parent_id: parent_id,
						name: fileData.name,
						token: token.access_token,
						email: user.login
					},
					headers: {"Authorization": "Bearer "+token.access_token},
				}
				
				util.sendAndReceive("boxUpload",data,"boxUploadResult"+data.query.name,function(result){
					cb(result);
				});
			}
		});
	};
	
	var getRootId = function(){
		return rootId;
	};
	
	var moveFile = function(data, cb){
		var self = this;
		util.getFile(data, function(file, name){
			cb(file,name);
		});
	};
	
	var otherServices = function(){
		return util.otherServices("box");
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