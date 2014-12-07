var rest = require('restler');
var config = require("config").cfg();
var fs = require('fs');

var box_sdk = require("box-sdk");
var logLevel = 'debug';

var box = box_sdk.Box({
	  client_id: config.api.box.client_id,
	  client_secret: config.api.box.secret,
	  port: config.api.box.port,
	  host: config.server.host
	}, logLevel);

module.exports = {
	getToken : function(code, cb) {
		var url = config.api.box.oauth_url + "/token";
		
		rest.post(url,{
			data: {
				"grant_type": "authorization_code",
				"code": code,
				"client_id": config.api.box.client_id,
				"client_secret": config.api.box.secret,
				"redirect_uri": config.api.box.redirect_uri
			}
		}).on("complete",function(data){
			cb(data);
		});
	},

	refreshToken : function(token, cb) {
		var url = config.api.box.oauth_url + "/token";		
		
		rest.post(url,{
			data: {
				"grant_type": "refresh_token",
				"refresh_token": token,
				"client_id": config.api.box.client_id,
				"client_secret": config.api.box.secret,
				"redirect_uri": config.api.box.redirect_uri
			}
		}).on("complete",function(data){
			cb(data);
		});
	},
	
	getUser: function(token, cb) {
		rest.get(config.api.box.api_url + "/users/me",{
			headers: {"Authorization": "Bearer "+token}
		}).on("complete",function(user){
			cb(user);
		});
	},
	
	getFolder: function(token, id, cb){
		rest.get(config.api.box.api_url + "/folders/"+id,{
			headers: {"Authorization": "Bearer "+token}
		}).on("complete",function(folder){			
			if(folder.item_collection.total_count < 1){
				cb({items: [],folder: folder});
				return;
			}
			
			var entries = folder.item_collection.entries;
			var total = folder.item_collection.total_count;
			var items = [];
			for(var i=0;i<entries.length;i++){
				if(entries[i].type == "folder"){
					rest.get(config.api.box.api_url + "/folders/"+entries[i].id, {
						headers: {"Authorization": "Bearer "+token}
					}).on("complete",function(folderItem){
						items.push(folderItem);
						if(items.length == total){
							cb({items: items,folder: folder});
							return;
						}
					}).on("error",function(err){
					});
				} else if(entries[i].type == "file"){
					rest.get(config.api.box.api_url + "/files/"+entries[i].id, {
						headers: {"Authorization": "Bearer "+token}
					}).on("complete",function(fileItem){
						items.push(fileItem);
						if(items.length == total){
							cb({items: items,folder: folder});
							return;
						}
					}).on("error",function(err){
					});
				} else {
					items.push(entries[i]);
					if(items.length == total){
						cb({items: items,folder: folder});
						return;
					}
				}
			}
		}).on("error",function(err){
		});
	},
	
	downloadFile: function(token, item, email, cb, follow){
		follow = follow || false;
		
		if(follow){
			var connection = box.getConnection(email);
			connection.setToken(token);
			
			var path = "tmp/"+item.name;
			
			connection.ready(function () {			
				connection.getFile(item.id, null, path, function(error){
					fs.readFile(path, function (err,data) {
						if (err) {
							return cb(err);
						}
						cb(data);
					});
				},null, false);
			});
		} else {
			rest.get(config.api.box.api_url + "/files/"+item.id+"/content",{
				headers: {"Authorization": "Bearer "+token},
				followRedirects: false
			}).on("complete",function(data,res){
				cb(res.headers.location);
			});
		}
		
		
	},
	
	deleteFile: function(id, auth, etag, type, cb){
		var url = config.api.box.api_url;
		var options = {
				headers: {"Authorization": auth},
				query: {}
		};
		
		if(type == "folder"){
			url += "/folders";
			options.query.recursive = true;
		} else {
			url += "/files";
			options.headers["If-Match"] = etag;
		}
		
		url += "/" + id;
		
		rest.del(url,options).on("complete",function(data,res){
			if(data == ""){
				cb(true);
			} else {
				cb(false);
			}
		});
	},
	
	uploadFile: function(query, headers, cb){
		var path = "tmp/"+query.name;
		var buf = new Buffer(query.content, 'base64');
		
		fs.writeFile(path, buf, function(err) {
		    if(err) {
		        cb(err);
		        return;
		    }
			
			var connection = box.getConnection(query.email);
			connection.setToken(query.token);
			
			connection.ready(function () {			
				connection.uploadFile(path, query.parent_id, null, function(error,file){
					if(!error){
						cb(file);
					} else {
						cb(error);
					}
					fs.unlink(path, function (err) {
						if (err) throw err;
					});
				},headers);
			});
		});
	}
}