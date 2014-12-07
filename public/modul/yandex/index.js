define([ 'plugins/router', 'durandal/app', 'knockout', 'api/yandex', 'ko-switch-case', 'zipjs/zip', 'kodragdrop' ], function(router, app, ko, yandex, ko_switch_case, zip, kodd) {
    
	var icons = {
			default: "page_white",
			folder: {
				default: "folder",
				public: "folder_public"
			},
			file: {
				"compressed": "page_white_compressed",
				"image": "page_white_picture",
				"executable": "page_white_gear",
				"document": "page_white_text",
				"web": "web",
				"development": "page_white_code",
				"data": "package"
			}
	}
	
	
    return {    	
    	files: ko.observableArray([]),
    	activeFolder: ko.observable(""),
        selected: ko.observableArray([]),
        hidden: ko.observable(true),
        userName: ko.observable(),
        uploadedFiles: ko.observableArray([]),
        deleted: ko.observable(),

        activate : function(settings) {
        	var self = this;

        	app.on("yandex:sizeChange",function(event){
        		self.hidden(event.hidden)
        	});
        	
        	app.on("yandex:drop",function(data){
        		for(var i=0;i<data.length;i++){
        			self.drop(data[i], self);
        		}
        	});
        	
        	app.on("serviceItem:change",function(data){
        		if(data.event == "logout"){
        			for(var i=0;i<self.getOtherServices().length;i++){
        				if(self.getOtherServices()[i].id == data.service){
        					self.getOtherServices.remove(self.getOtherServices()[i]);
        				}
        			}
        		}
        	});
        	
        	self.files.subscribe(function(changes) {
        	    self.files().sort(function(left, right) {
        	    	var ret = 0;
        	    	if(left.type == "dir" && right.type=="dir"){
        	    		ret = (left.name == right.name ? 0 : (left.name < right.name ? -1 : 1));
        	    	} else if(left.type == "dir" && right.type!="dir"){
        	    		ret = -1;
        	    	} else if(left.type != "dir" && right.type=="dir"){
        	    		ret = 1;
        	    	} else {
        	    		ret = (left.name == right.name ? 0 : (left.name < right.name ? -1 : 1));
        	    	}        	    	
        	    	return ret;
        	    });
        	}, null, "arrayChange");
        	
        	yandex.authorize();
        	
        	yandex.getUserInfo(function(info){
	        	yandex.listFiles(function(files, activeFolder){
	        		self.files(files);	        		
	        		self.activeFolder(activeFolder);
	        		if(files.length > 0){
	        			self.hidden(false);
	        			app.trigger('serviceItem:change',{service:'yandex',event:'login'});
	        		}
	        		self.selected([]);
	        		self.userName(info.name);
	    		});
        	
        	});        	
        },
        
        attached: function(){
        	
        },
        
        compositionComplete: function(){
        	var self = this;        	
        	
        	$('#YANDEX #selectAllYandex').change(function() {
                if($(this).is(":checked")) {
                	self.selected(self.files());
                	$("#YANDEX table tbody tr").addClass("active");
                } else {
                	self.selected([]);
                	$("#YANDEX table tbody tr").removeClass("active");
                }
            });
   	
        	$("#YANDEX #uploadDiv").delegate('#uploader','change', function() {
        		var array = $("#YANDEX #uploader")[0].files;
        		
        		for(var i=0;i<array.length;i++){
        			self.uploadedFiles.push(array[i]);
        		}

        		$("#YANDEX #uploader").val("");
        	});

        },
        
        toggleLoading: function(){
        	
        },
        
        getDate: function(dateStr){
        	var date = new Date(dateStr);
        	var year = date.getFullYear();
        	var month = fix(date.getMonth() + 1);
        	var day = fix(date.getDate());
        	var hour = fix(date.getHours());
        	var min = fix(date.getMinutes());
        	var sec = fix(date.getSeconds());
        	
        	function fix(num){
        		if(num < 10){
        			num = "0"+num;
        		}
        		return num;
        	}
        	
        	return year+". "+month+". "+day+". "+hour+":"+min+":"+sec;
        },
        
        getIcon: function(data){
        	var link = "images/yandex-icons/";
        	switch(data.type){
        	case 'dir':
        		if(data.public_key){
        			link += icons.folder.public;
        		} else {
        			link += icons.folder.default;
        		}
        		break;
        	case 'file':
        		link += icons.file[data.media_type];
        		break;
    		default:
    			link += icons.default;
        	}
        	
        	if(link == "images/yandex-icons/undefined"){
        		link = "images/yandex-icons/" + icons.default;
        	}
        	
        	link += ".gif";
        	return link;
        },
        
        clickRow: function(context, data, event) {        	
        	if($(event.target).hasClass("action")){
        		return;
        	}
        	
        	var HTMLElement = $(event.target).parents("tr");
        	
        	if($(HTMLElement).hasClass("active")){
    			$(HTMLElement).removeClass("active");
    		} else {
    			$(HTMLElement).addClass("active");
    		}
        	
        	var hasItem = false;
        	for(var i=0;i<context.selected().length;i++){
        		if(context.selected()[i].path == data.path){
        			hasItem = true;
        			break;
        		}
        	}
        	
        	if(hasItem){
        		context.selected.remove(data);
        	} else {
        		context.selected.push(data);
        	}
        },
        
        downloadItem: function(data, event){
        	$("#YANDEX #loading").show();
        	yandex.downloadItem(data, function(url){
        		$("#hiddenFrame").attr("src",url);
        		$("#YANDEX #loading").hide();
        	});
        },
        
        openDeleteDiv: function(context, data, event){
        	$("#YANDEX #deleteItemDiv").toggle();
        	context.deleted(data);
        },
        
        deleteItem: function(context, event){
        	var data = context.deleted();
			$("#YANDEX #loading").show();
			
			yandex.deleteItem(data, function(result){
				if(result == undefined || result.href){
					context.files.remove(data);
					context.selected.remove(data);
				}
				$("#YANDEX #deleteItemDiv").hide();
				$("#YANDEX #loading").hide();				
			});
        },
        
        deleteMoreItems: function(context,event){
        	if(context.selected().length == 0){
        		context.toggleDiv('deleteConfirmationDiv');
        		return;
        	}
        	
        	$("#YANDEX #loading").show();
        	
        	var fileData = context.selected()[0];
        	
    		
        	yandex.deleteItem(fileData, function(error, result){
        		context.files.remove(fileData);
        		context.selected.remove(fileData);
        		
				if(context.selected().length == 0){
					$("#YANDEX #loading").hide();
					context.toggleDiv('deleteConfirmationDiv');							
				} else {
					context.deleteMoreItems(context,event);
				}
			});
        },
        
        toggleWindow: function(context, event){
        	app.trigger('serviceItem:change',{service:'yandex',event:'small'});
        },
        
        logout: function(context, event){
        	yandex.logout();
        	context.selected([]);
        	context.hidden(true);
        	app.trigger('serviceItem:change',{service:'yandex',event:'logout'});
        },

        upload: function(context, event) {
        	if(context.uploadedFiles().length == 0){
      		  	context.toggleDiv('uploadContentDiv');
        		return;
        	}
        	
        	$("#YANDEX #loading").show();
        	
        	$("#YANDEX #uploadDiv button").prop('disabled', true);
        	$("#YANDEX #uploadDiv input").prop('disabled', true);
        	
            
            var path = context.activeFolder().path;
            var uploadedItemNum = 0;
            
            if(path != "disk:/"){
            	path += "/";
            }
            
            var fileData = context.uploadedFiles()[0];
            
            context.getContent(fileData,function(content){
            	yandex.upload(path+""+fileData.name, content, function(exist){
            		context.uploadedFiles.remove(fileData);
            		
            		if(context.uploadedFiles().length == 0){
            			$("#YANDEX #uploadDiv button").prop('disabled', false);
            			$("#YANDEX #uploadDiv input").prop('disabled', false);
            			
            			yandex.listFiles(path, function(files, activeFolder){
            				context.files(files);
            				context.activeFolder(activeFolder);
            				$("#YANDEX #loading").hide();
        	        		context.toggleDiv('uploadContentDiv');
        	    		});
            		} else {
            			context.upload(context, event);
            		}
            	});
            });             	
        },
        
        getContent: function(fileData, cb){
        	var reader = new FileReader();
                        
            reader.readAsBinaryString(fileData);
            reader.onload = function(e) {        	 
            	cb(btoa(reader.result));
            };             
        },
        
        toggleDiv: function(div, context, event){
        	$("#YANDEX #"+div+".popupDiv").toggle();
        },
        
        deleteFromUploadFiles: function(context, item){
        	context.uploadedFiles.remove(item);
        },
        
        openFolder: function(context, item, event){
        	$("#YANDEX #loading").show();
        	
        	yandex.listFiles(item.path, function(files, activeFolder){
        		context.files(files);
        		context.activeFolder(activeFolder);
        		context.selected([]);
        		$("#YANDEX #loading").hide();
        	});
        },
        
        goToParent: function(context, event){
        	$("#YANDEX #loading").show();
        	
        	var folders = context.activeFolder().path.split("/");
        	var path = "";
        	
        	for(var i=0;i<folders.length-1;i++){
        		path += folders[i]+"/";
        	}
        	
        	yandex.listFiles(path, function(files, activeFolder){
        		context.files(files);
        		context.activeFolder(activeFolder);
        		context.selected([]);
        		$("#YANDEX #loading").hide();
        	});
        },
        
        drop: function(data, model){
        	if(data.service != "yandex"){
        		$("#YANDEX #loading").show();
        	
	        	var path = model.activeFolder().path;

	        	yandex.moveFile(data, path, function(file, name){
	        		if(!file){
	        			alert(name);
	        			return;
	        		}
	        		model.getContent(file,function(content){
	        			yandex.upload(path+"/"+name, content, function(exist){
	        				yandex.listFiles(path, function(files, activeFolder){
	        					model.files(files);
	        					model.activeFolder(activeFolder);
	        					$("#YANDEX #loading").hide();
	        	    		});
	        			});
	        		});
	        	});
	        }
        },
        
        exportItems: function(context, event){
        	var services = $("#YANDEX #content #exportDiv #checkDiv .check img.active");
        	for(var i=0;i<services.length;i++){
        		var target = $(services[i]).attr("value");
        		for(var i=0;i<context.selected().length;i++){
        			if(context.selected()[i].type == "dir"){
        				context.selected.remove(context.selected()[i]);
        			}
        		}
        		app.trigger(target+":drop",context.selected());
        	}
        	$("#YANDEX #content #exportDiv #checkDiv .check img").removeClass("active");
        	context.selected([]);
        	$("#YANDEX table tbody tr").removeClass("active");
        	context.toggleDiv('exportDiv');
        },
        
        refresh: function(context, event){  
        	$("#YANDEX #loading").show();
        	
        	yandex.getUserInfo(function(info){
        		var path = context.activeFolder().path;
                
                if(path != "disk:/"){
                	path += "/";
                }
        		
	        	yandex.listFiles(path, function(files, activeFolder){
	        		context.files(files);	        		
	        		context.activeFolder(activeFolder);
	        		$("#YANDEX table tbody tr").removeClass("active");
	        		context.selected([]);
	        		context.userName(info.name);
	        		$("#YANDEX #loading").hide();
	    		});        	
        	});  
        },
        
        getOtherServices: ko.observableArray(yandex.otherServices())
    };
});