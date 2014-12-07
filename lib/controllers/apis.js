var services = require("../services/index");

module.exports = function(app) {
	app.get("/getGoogleToken",function(req,res){		
		services.get('drive').getToken(req.query.code, function(token){
			res.json(token);
		});
	});
	
	app.get("/getGoogleAuth",function(req,res){
		res.json(services.get('drive').getAuthUrl());
	});
	
	app.get("/refreshGoogleToken",function(req,res){
		services.get('drive').refreshToken(req.query.token, function(token){
			res.json(token);
		});
		
	});
	
	app.get("/getDropboxToken",function(req,res){		
		services.get('dropbox').getToken(req.query, function(token){
			res.json(token);
		});
	});
	
	app.get("/getMicrosoftAuth",function(req,res){
		res.json(services.get('microsoft').getAuthUrl());
	});
	
	app.get("/getMicrosoftToken",function(req,res){
		services.get('microsoft').getToken(req.query.code, function(token){
			res.json(token);
		});
	});
	
	app.get("/refreshMicrosoftToken",function(req,res){
		services.get('microsoft').refreshToken(req.query.token, function(token){
			res.json(token);
		});		
	});
	
	app.get("/yandexUserinfo",function(req,res){
		services.get('yandex').getUserInfo(req.query.token,function(data){
			res.json(data);
		});
	});
	
	app.get("/yandexUpload",function(req,res){
		services.get('yandex').upload(req.query.url,req.query.content,req.query.token,function(data){
			res.json(data);
		});
	});
	
	app.get("/getYandexFile",function(req,res){
		services.get('yandex').getFile(req.query.url,req.query.token,function(data){
			res.json(data);
		});
	});
	
	app.get("/getBoxToken",function(req,res){
		services.get('box').getToken(req.query.code, function(token){
			res.json(token);
		});
	});
	
	app.get("/refreshBoxToken",function(req,res){
		services.get('box').refreshToken(req.query.token, function(token){
			res.json(token);
		});	
	});
	
	app.get("/getBoxUser",function(req,res){
		services.get('box').getUser(req.query.token, function(user){
			res.json(user);
		});
	});
	
	app.get("/getBoxFolder",function(req,res){
		services.get('box').getFolder(req.query.token, req.query.id, function(folder){
			res.json(folder);
		});
	});
	
	app.get("/getBoxFile",function(req,res){
		services.get('box').downloadFile(req.query.token, req.query.item, req.query.email, function(file){
			res.json(file);
		});
	});
	
	app.del("/boxFile/:id",function(req,res){
		services.get("box").deleteFile(req.params.id, req.headers.authorization, req.headers["if-match"], req.query.type, function(result){
			res.json(result);
		});	
	});
	/*
	app.get("/getBoxFileFromUrl",function(req,res){
		services.get("box").downloadFile(req.query.token, req.query.item, req.query.email, function(content){
			res.json(content);
		}, true);
	});
	*/
}