var services = require('./../services');

module.exports = function(socket) {
    /**
     * request and send init data - user by id
     */
    socket.on('getInitData', function(data) {
        services.get('profile').getProfile(data, function(result) {
            
            socket.emit('getInitDataResult', {
                'currentUser' : result.data
            });
        });
    });
    
    socket.on("yandexUpload", function(data){
    	services.get('yandex').upload(data.url,data.content,data.token,function(err,exist){
			socket.emit("yandexUploadResult"+data.url,{err:err,exist:exist});
		});
    });
    
    socket.on("boxUpload",function(data){
    	services.get("box").uploadFile(data.query, data.headers, function(result){
			socket.emit("boxUploadResult"+data.query.name,result);
		});
    });
    
    socket.on("getBoxFileContent",function(query){
    	services.get("box").downloadFile(query.token, query.item, query.email, function(content){
    		socket.emit("getBoxFileContentResult"+query.item.name,{content:content});
		}, true);
    });
}
