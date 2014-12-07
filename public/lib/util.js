define([ 'plugins/router', 'durandal/app', 'jquery', 'dbapi/dropbox'],function(router, app, $, dropbox) {
	var DBconfig = {
			client_id : "z47xwqxo4mfsbnh",
			secret : "juzfywgw40reqym",
			redirect_uri : "http://localhost:10001/",
			api_url : "https://api.dropbox.com/1",
			oauth_url: "https://www.dropbox.com/1/oauth2"
	};
	
	var users = {};
	var services = [
	                {id: "google", name:"Google Drive", token: "google_token"},
	                {id: "dropbox", name:"Dropbox", token: "dropbox_token"},
	                {id: "yandex", name:"Yandex.Disk", token: "yandex_token"},
	                {id: "box", name:"Box", token: "box_token"},
	                ];
	
	function QueryString() {
		var query_string = {};
		var query = window.location.search.substring(1);
		var vars = query.split("&");
		for ( var i = 0; i < vars.length; i++) {
			var pair = vars[i].split("=");
			// If first entry with this name
			if (typeof query_string[pair[0]] === "undefined") {
				query_string[pair[0]] = pair[1];
				// If second entry with this name
			} else if (typeof query_string[pair[0]] === "string") {
				var arr = [ query_string[pair[0]], pair[1] ];
				query_string[pair[0]] = arr;
				// If third or later entry with this name
			} else {
				query_string[pair[0]].push(pair[1]);
			}
		}
		return query_string;
	};

	function RemoveParamsFromUrl() {
		window.location.search = "";
	};

	function getCookie(name) {
		var value = "; " + document.cookie;
		var parts = value.split("; " + name + "=");
		if (parts.length == 2)
			return parts.pop().split(";").shift();
	};
	
	function delete_cookie(name) {
		  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
	};
	
	function JSONLength(json){
		var key, count = 0;
		for(key in json) {
		  if(json.hasOwnProperty(key)) {
		    count++;
		  }
		}
		return count;
	};
	
	function getJSONMaxIdx(json){
		var key, max = 0;
		for(key in json){
			try{
				key = parseInt(key);
				if(key > max){
					max = key;
				}
			} catch(e){}
		}
		return max;
	};
	
	function dragAndDrop(data, cb){
		var url;
		var token;
		var name;
		switch(data.service){
		case 'google':
			if(data.mimeType == "application/vnd.google-apps.folder"){
				cb(false, "Directory is not supported at drag and drop yet!");
				return;
			}
			url = data.downloadUrl;	
			name = data.title;
			try {
				token = JSON.parse(getCookie("google_token"));
			} catch(e) {}
			downloadFile(url, token, function(file){
				cb(file, name);			
			});
			break;
		case 'dropbox':
			if(data.mimeType == "inode/directory"){
				cb(false, "Directory is not supported at drag and drop yet!");
				return;
			}
			name = data.name;
			try {
				token = JSON.parse(getCookie("dropbox_token"));
				var client = new Dropbox.Client({ 
					key: DBconfig.client_id,
					secret: DBconfig.secret,
					sandbox: false,
					token: token.access_token
				});
				client.makeUrl(data.path,{download: true},function(error,url){
					if(!error){
						url = url.url;
						downloadFile(url, token, function(file){
							cb(file, name);			
						});
					}
				});
			} catch(e) {}
			break;
		case 'yandex':
			if(data.type == "dir"){
				cb(false, "Directory is not supported at drag and drop yet!");
				return;
			}
			name = data.name;
			try {
				token = JSON.parse(getCookie("yandex_token"));
				$.ajax({
					method: "GET",
					url: "https://cloud-api.yandex.net/v1/disk/resources" + "/download",
					headers: {Authorization: "OAuth "+token.access_token},
					data: {
						path: data.path
					}
				}).done(function(url){
					$.ajax({
						method: "GET",
						url: "/getYandexFile",
						data: {url: data.path,token: token.access_token}
					}).done(function(file){
						file = toArrayBuffer(file);						
						
						var blob = new Blob([file],{type: data.mime_type});
						cb(blob, name);
					});
				});
			} catch(e) {}
			break;
		case 'box':
			if(data.type == "folder"){
				cb(false, "Directory is not supported at drag and drop yet!");
				return;
			}
			
			name = data.name;
			
			try {
				token = JSON.parse(getCookie("box_token"));
				
				var fileData = {
					token: token.access_token,
					item: data,
					email: users.box.login
				}
				
				var isDuplicate = false;
				
				sendAndReceive("getBoxFileContent",fileData,"getBoxFileContentResult"+name, function(data){
					if(!isDuplicate){
						isDuplicate = true;
						var blob = new Blob([data.content],{type: "application/octet-stream"});
						cb(blob, name);
					}
				});
			} catch(e) {}
			
			break;
		}	
	};
	

	function downloadFile(url, token, callback) {
		if (url) {
			var accessToken = token.access_token;
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url);
			xhr.responseType = 'blob';
			xhr.setRequestHeader('Authorization', 'Bearer '
					+ accessToken);
			xhr.onload = function() {
				callback(xhr.response);
			};
			xhr.onerror = function() {
				callback(null);
			};
			xhr.send();
		} else {
			callback(null);
		}
	};
	
	function emit(target, data){
		if(!socket.socket.connected){
			socket = io.connect();
			socket.on('connect', function() {
				socket.emit(target,data);
			});
		} else {
			socket.emit(target,data);
		}
	};
	
	function on(source, cb){
		if(!socket.socket.connected){
			socket = io.connect();
			socket.on('connect', function() {
				socket.on(source,cb);
			});
		} else {
			socket.on(source,cb);
		}	
	};
	
	function sendAndReceive(target, data, source, cb){
		socket.emit(target,data);
		socket.on(source, cb);
	}
	
	function addUser(service, user){
		users[service] = user;
	};
	
	function removeUser(service){
		users[service] = null;
	};
	
	function toArrayBuffer(buffer) {
		var ab = new ArrayBuffer(buffer.length);
		var view = new Uint8Array(ab);
		for (var i = 0; i < buffer.length; ++i) {
			view[i] = buffer[i];
		}
		return ab;
	};
	
	function otherServices(me){
		var ret = [];
		for(var i=0;i<services.length;i++){
			if(services[i].id != me && getCookie(services[i].token)){
				ret.push(services[i]);
			}
		}
		return ret;
	}
	
	return {
		query : QueryString,
		removeParamsFromUrl : RemoveParamsFromUrl,
		getCookie : getCookie,
		deleteCookie: delete_cookie,
//		JSONLength: JSONLength,
//		getJSONMaxIdx: getJSONMaxIdx
		getFile: dragAndDrop,
		send: emit,
		receive: on,
		sendAndReceive: sendAndReceive,
		addUser: addUser,
		removeUser: removeUser,
		otherServices: otherServices
	}
});