define([ 'plugins/router', 'durandal/app', 'jquery', 'util', '//js.live.net/v5.0/wl.js'], function(router, app, $, util) {
	var config = {
		"client_id" : "000000004812F8C1",
		"secret" : "t4zChXjhH6Q-bLnQxzCBZX9uFVVgiiSH",
		"redirect_uri" : "https://kacsadomain.com:10001",
		"scopes" : ["wl.basic", "wl.signin", "wl.skydrive_update", "wl.offline_access"],
		"api_url" : "https://apis.live.net/v5.0",
		"oauth_url": "https://login.live.com"
	};
	
	var user = {};
	var allFolders = [];
	var rootId = 0;
	
	var init = function(){
		WL.init({
		    client_id: config.client_id,
		    redirect_uri: config.redirect_uri,
		    scope: config.scopes, 
		    response_type: "token"
		});
	}
	
	var login = function() {		
		init();

		WL.logout();
		
		if (!WL.getSession()) {
		    WL.login({
		    	scope: config.scopes
		    }).then(function(response){},
		    		function(err){
		    	//TODO handle error
		    });
		}
	};
	
	var getToken = function(){
		init();
		if(!WL.getSession()){
			login();
		}
		return WL.getSession();
	};
	
	var getAuthorized = function(){
		if(getToken()){
			return true;
		}
		return false;
	};
	
	var getUserInfo = function(cb){
		var token = getToken();
		if(token != null){
			WL.api({
			    path: "me",
			    method: "GET"
			}).then(function(info){
				user = info;
				WL.api({
	                path: "/me/skydrive",
	                method: "GET"
	            }).then(function (root) {
	                   user.rootFolder = root;
	                   console.log(user);
	                   cb(user);
	            });				
			});
		}
	};
	
	var logout = function(){
		init();
		WL.logout();
	};
	
	var listFiles = function(folder, cb){
		if ((!cb) && (typeof folder === 'function')) {
			cb = folder;
			folder = user.rootFolder;
		}
		
		init();
		
		WL.api({
            path: folder.id+"/files",
            method: "GET"
        }).then(function (files) {
        	files = files.data;
        	for(var i=0;i<files.length;i++){
        		files[i].service = "microsoft";
        	}
        	cb(files,folder);
        },function(error){
        	cb([]);
        });
	};
	
	var getFolders = function(){
		return allFolders;
	};
	
	var downloadItem = function(item, cb){
		var token = getToken();
		if(token != null){
			var url = config.api_url + "/" + item.id + "/content?download=true&access_token="+token.access_token;
			cb(url);
		} else {
			cb(null);
		}
	};
	
	var deleteItem = function(item, cb){		
		init();
		
		WL.api({
            path: item.id,
            method: "DELETE"
        }).then(function (response) {
        	cb(true);
        },function (responseFailed) {
        	cb(false);
        });
	};
	
	var getUser = function(){
		return user;
	};
	
	var upload = function(blob, folder, cb){
		if ((!cb) && (typeof folder === 'function')) {
			cb = folder;
			folder = user.rootFolder;
		}
		
		init();

		var reader = new FileReader();

		reader.onload = function(e) {
		  var text = reader.result;
		  $.ajax({
				method: "POST",
				url: config.api_url + "/" + folder.id + "/files/valami.jpg?access_token="+getToken().access_token,
				data: text
		  }).done(function(file){
				console.log(file);
		  }).error(function(e){
			  console.log(e);
		  });
		}

		reader.readAsText(blob,"UTF-8");
		
		
		
		WL.upload({
			path : folder.id,
			element: 'Muploader',
			overwrite : true
		}).then(function(result) {
			cb(result);
		}, function(result) {
			console.log(result);
			cb(null);
		});
	};
	
	var uploadFolder = function(data,cb){
		getValidateToken(function(token){
	    	//data.uploadType = "multipart";
		    $.ajax({
		    	method: 'POST',
		    	url: config.api_url + "/drive/v1/files",
				headers: {
					"Authorization": "Bearer " + token.access_token,
					"Content-Type": "application/json; charset=UTF-8"},
				data: {
					"title": "pets",
					"mimeType": "application/vnd.google-apps.folder"
				}	
		    }).done(function(data){
		    	cb(data);
		    }).error(function(err1,err2,err3){
		    	cb(null,err1,err2,err3);
		    });
	    });
	};
	
	var getRootId = function(){
		return rootId;
	};
	
	var moveFile = function(data, path, cb){
		util.getFile(data, function(file, name){
			cb(file, name);
		});
	}
	
	var microsoft = {
		title : "Microsoft oneDrive API",
		login : login,
		getUserInfo: getUserInfo,
		listFiles: listFiles,
		downloadItem: downloadItem,
		deleteItem: deleteItem,
		getUser: getUser,
		getFolders: getFolders,
		upload: upload,
		getRootId: getRootId,
		uploadFolder: uploadFolder,
		logout: logout,
		moveFile: moveFile
	};

	return microsoft;
});