define([ 'plugins/router', 'durandal/app', 'jquery', 'util', 'wlapi'], function(router, app, $, util, WL) {
	var config = {
		"client_id" : "000000004C12B831",
		"secret" : "N-nK9Ouud68ruFs3PBTIvTfVh6B3s78T",
		"redirect_uri" : "https://kacsadomain.com:10001",
		"scopes" : "wl.basic wl.signin wl.skydrive_update wl.offline_access",
		"api_url" : "https://apis.live.net/v5.0",
		"oauth_url": "https://login.live.com"
	};
	
	var user = {};
	var allFolders = [];
	var rootId = 0;
	var login = function() {
		$.ajax({
			method: "GET",
			url: "/getMicrosoftAuth"
		}).success(function(data){
			window.location = data;
			var exp = new Date().getTime() + 86400000;
			document.cookie = 'actual=microsoft;expires='+ exp;
		});
	};

	var authorize = function(){	
		if(util.query().code && util.getCookie('actual') == "microsoft"){
			$.ajax({
				method: "GET",
				url: "/getMicrosoftToken",
				data: {code: util.query().code}
			}).success(function(data){
				var expires = new Date(new Date().getTime() + data.expires_in*1000);
				document.cookie = 'microsoft_token=' + JSON.stringify(data) + "; expires=" + expires;
				util.removeParamsFromUrl();
			}).error(function(){
				
			});
		}
	};
	
	var getToken = function(){
		try {			
			var token = JSON.parse(util.getCookie("microsoft_token"));
			return token;
		} catch(e) {
			return null;
		}
	};
	
	var getValidateToken = function(cb){	
		try {
			var token = JSON.parse(util.getCookie("microsoft_token"));
			var expires = new Date(new Date().getTime() + token.expires_in*1000);
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
			url: "/refreshMicrosoftToken",
			data: {token: token}
		}).success(function(data){
			var expires = new Date(new Date().getTime() + data.expires_in*1000);
			document.cookie = 'microsoft_token=' + JSON.stringify(data) + "; expires=" + expires;
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
		getValidateToken(function(token){
			if(token != null){
				$.ajax({
					method: "GET",
					url: config.api_url + "/me",
					data: {access_token: token.access_token}
				}).success(function(data){
					user = data;
					$.ajax({
						 method: "GET",
						 url: config.api_url + "/me/skydrive",
						 data: {access_token: token.access_token}
					 }).done(function(root){
						user.rootFolder = root;
						cb(true);
					 });
					
				});
			}
		});
	};
	
	var logout = function(){
		util.deleteCookie("microsoft_token");
	};
	
	var listFiles = function(folder, cb){
		var folderId = "";
		if ((!cb) && (typeof folder === 'function')) {
			cb = folder;
		} else if(folder.id != user.rootFolder.id){
			folderId = "/"+folder.id;
		}
		
		getValidateToken(function(token){
			if(token != null){
				
				$.ajax({
					 method: "GET",
					 url: config.api_url + "/me/skydrive"+folderId+"/files",
					 data: {access_token: token.access_token}
				 }).done(function(data){
					 var activeFolder = {};
					 if(folderId == ""){
						 activeFolder = user.rootFolder;
					 } else {
						 activeFolder = folder;
					 }
					 cb(data.data,activeFolder);
				 });
			} else {
				cb([]);
			}
			
			
		});		 
	};
	
	var getFolders = function(){
		return allFolders;
	};
	
	var downloadItem = function(item, cb){
		getValidateToken(function(token){
			if(token != null){
				var url = config.api_url + "/" + item.id + "/content?access_token="+token.access_token;
				cb(url);
				/* download=true& */
			}
		});
		cb(null);
	};
	
	var deleteItem = function(item, cb){
		//https://apis.live.net/v5.0/file.b7c3b8f9g3616f6f.B7CB8F9G3626F6!225?access_token=ACCESS_TOKEN
		
		getValidateToken(function(token){
			$.ajax({
				method: "DELETE",
				url: config.api_url + "/" + item.id + "?access_token=" + token.access_token,
			}).success(function(result){
				if(result == undefined){
					cb(true);
				}
			}).error(function(){
				cb(false);
			});
		});
	};
	
	var getUser = function(){
		return user;
	};
	
	var upload = function(multipartRequestBody, boundary, fileData, content, folder, cb){
		var folderId = "";
		if ((!cb) && (typeof folder === 'function')) {
			cb = folder;
		} else {
			folderId = "/"+folder.id;
		}
		
	    getValidateToken(function(token){
		    $.ajax({
		    	method: 'POST',
		    	url: config.api_url + '' + folderId + "/files?access_token="+token.access_token,
				headers: {
					'Content-Type': 'multipart/form-data; boundary=' + boundary
				},
				data: multipartRequestBody    		
		    }).done(function(data){
		    	console.log(data);
		    	$.ajax({
		    		method: "PUT",
		    		url: config.api_url + '' + folderId + "/files/"+fileData.name+"?access_token="+token.access_token,
		    		data: content
		    	}).done(function(d,f,g){
		    		console.log(d);
		    		console.log(f);
		    		console.log(g);
		    	}).error(function(d,f,g){
			    	console.log(d);
			    	console.log(f);
			    	console.log(g);
			    });
		    }).error(function(d,f,g){
		    	console.log(d);
		    	console.log(f);
		    	console.log(g);
		    });
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
		authorize: authorize,
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