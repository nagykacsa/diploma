define([ 'plugins/router', 'durandal/app', 'jquery', 'util'/*, 'gapi'*/ ], function(router, app, $, util/*, gapi*/) {
	var config = {
		client_id : "46345484780-0di8uqfus7f8matvao2fkch4pqblkt9p.apps.googleusercontent.com",
		email : "46345484780-0di8uqfus7f8matvao2fkch4pqblkt9p@developer.gserviceaccount.com",
		secret : "SQlgHZOjdSgMtP0FNWnUIr-X",
		redirect_uri : "htts://localhost:10001",
		origin : "http://localhost:10001",
		scopes : 'https://www.googleapis.com/auth/drive',
		api_url : "https://www.googleapis.com",
		oauth_url: "https://accounts.google.com/o/oauth2",
		api_key: "AIzaSyBVFKJGIIHFphu5UzEwTzgn1u6m3SHuzFs"
	};
	
	var user = {};
	var allFolders = [];
	var rootId = 0;
	
	var login = function() {
		$.ajax({
			method: "GET",
			url: "/getGoogleAuth",
		}).success(function(data){
			window.location = data;
			var exp = new Date().getTime() + 300000;
			document.cookie = 'actual=drive;expires='+ exp;
		});	
	};

	var authorize = function(){	
		if(util.query().code && util.getCookie('actual') == "drive"){
			$.ajax({
				method: "GET",
				url: "/getGoogleToken",
				data: {code: util.query().code}
			}).success(function(data){
				document.cookie = 'google_token=' + JSON.stringify(data) + "; expires=" + new Date(data.expiry_date);
				util.removeParamsFromUrl();
			}).error(function(){
				
			});
		}
	};
	
	var getToken = function(){
		try {
			var token = JSON.parse(util.getCookie("google_token"));
			return token;
		} catch(e) {
			return null;
		}
	};
	
	var getValidateToken = function(cb){	
		try {
			var token = JSON.parse(util.getCookie("google_token"));
			var expires = token.expiry_date;
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
			url: "/refreshGoogleToken",
			data: {token: token}
		}).success(function(data){
			document.cookie = 'google_token=' + JSON.stringify(data) + "; expires=" + new Date(data.expiry_date);
			cb(data);
		});
	};
	
	var getAuthorized = function(){
		if(getToken()){
			return true;
		}
		return false;
	};
	
	var getUserInfo = function(){
		getValidateToken(function(token){
			if(token != null){
				$.ajax({
					method: "GET",
					url: config.api_url + "/oauth2/v2/userinfo",
					headers: {Authorization: "Bearer " + token.access_token}
				}).success(function(data){
					user = data;
				});
			}
		});
	};
	
	var logout = function(){
		util.deleteCookie("google_token");
	};
	
	var listFiles = function(cb){
		getValidateToken(function(token){
			if(token != null){
				$.ajax({
					 method: "GET",
					 url: config.api_url + "/drive/v2/files",
					 headers: {Authorization: "Bearer " + token.access_token},
					 data: {maxResults: 1000}
				 }).done(function(data){
					 data = data.items;
					 
					 //File-ok és mappák szétválasztása
					 var drive = [];
					 var folders = [];
					 var files = [];
					 
					 for(var i=0;i<data.length;i++){
						 data[i].service = "google";
						 if(data[i].mimeType == 'application/vnd.google-apps.folder'){
							 data[i].items = [];
							 folders.push(data[i]);
						 } else {
							 files.push(data[i]);
						 }
					 }
					 
					 for(var i=0;i<files.length;i++){
						 if(files[i].parents.length == 0 || files[i].parents[0].isRoot){
							 drive.push(files[i]);
						 } else {
							 for(var j=0;j<folders.length;j++){
								 if(folders[j].id == files[i].parents[0].id){
									 folders[j].items.push(files[i]);
								 }
							 }
						 }
					 }
					 
					 for(var i=0;i<folders.length;i++){
						 if(folders[i].parents.length == 0 || folders[i].parents[0].isRoot){
							 drive.push(folders[i]);
							 allFolders.push(folders[i]);
						 } else {
							 for(var j=0;j<folders.length;j++){
								 if(folders[j].id == folders[i].parents[0].id){
									 folders[j].items.push(folders[i]);
									 allFolders.push(folders[i]);
								 }
							 }
						 }
					 }
					
					 cb(drive);
				 });
				
				$.ajax({
			    	method: 'GET',
			    	url: config.api_url + "/drive/v2/about",
					headers: {Authorization: "Bearer " + token.access_token}		
			    }).done(function(data){
			    	rootId = data.rootFolderId;
			    });
			} else {
				cb([]);
			}
			
			
		});		 
	};
	
	var getFolders = function(){
		return allFolders;
	}
	
	var downloadItem = function(item){
	};
	
	var deleteItem = function(item, cb){
		getValidateToken(function(token){
			$.ajax({
				method: "DELETE",
				url: config.api_url + "/drive/v2/files/" + item.id,
				headers: {Authorization: "Bearer " + token.access_token}
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
	
	var upload = function(multipartRequestBody, boundary, cb){
	    getValidateToken(function(token){
		    $.ajax({
		    	type: 'POST',
		    	url: config.api_url + "/upload/drive/v2/files?uploadType=multipart",
				headers: {
					Authorization: "Bearer " + token.access_token,
					'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
				},
				data: multipartRequestBody,
				//contentType: 'multipart/mixed; boundary="' + boundary + '"'
		    }).done(function(data){
		    	cb(data);
		    }).error(function(d,f,g){
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
	};
	
	var otherServices = function(){
		return util.otherServices("google");
	};
	
	var drive = {
		title : "Google Drive API",
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
		moveFile: moveFile,
		otherServices: otherServices
	};

	return drive;
});