define([ 'plugins/router', 'durandal/app', 'knockout', 'api/box', 'ko-switch-case', 'zipjs/zip', 'kodragdrop' ], function(router, app, ko, box, ko_switch_case, zip, kodd) {
    
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

        	app.on("box:sizeChange",function(event){
        		self.hidden(event.hidden)
        	});
        	
        	app.on("box:drop",function(data){
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
        	    	if(left.type == "folder" && right.type=="folder"){
        	    		ret = (left.name == right.name ? 0 : (left.name < right.name ? -1 : 1));
        	    	} else if(left.type == "folder" && right.type!="folder"){
        	    		ret = -1;
        	    	} else if(left.type != "folder" && right.type=="folder"){
        	    		ret = 1;
        	    	} else {
        	    		ret = (left.name == right.name ? 0 : (left.name < right.name ? -1 : 1));
        	    	}        	    	
        	    	return ret;
        	    });
        	}, null, "arrayChange");
        	
        	box.authorize();
        	
        	
        	box.getUserInfo(function(info){
	        	box.listFiles(function(files, activeFolder){
	        		self.files(files);	        		
	        		self.activeFolder(activeFolder);
	        		if(files.length > 0){
	        			self.hidden(false);
	        			app.trigger('serviceItem:change',{service:'box',event:'login'});
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
        	
        	$('#BOX #selectAllBox').change(function() {
                if($(this).is(":checked")) {
                	self.selected(self.files());
                	$("#BOX table tbody tr").addClass("active");
                } else {
                	self.selected([]);
                	$("#BOX table tbody tr").removeClass("active");
                }
            });
   	
        	$("#BOX #uploadDiv").delegate('#uploader','change', function() {
        		var array = $("#BOX #uploader")[0].files;
        		
        		for(var i=0;i<array.length;i++){
        			self.uploadedFiles.push(array[i]);
        		}

        		$("#BOX #uploader").val("");
        	});
        	
        	$("#SHELL #serviceDiv #content #exportDiv #checkDiv .check img").click(function(){
        		if($(this).hasClass("active")){
        			$(this).removeClass("active");
        		} else {
        			$(this).addClass("active");
        		}
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
        	var link = "images/box-icons/";
        	switch(data.type){
        	case 'folder':
        		if(data.shared_link){
        			link += icons.folder.public;
        		} else {
        			link += icons.folder.default;
        		}
        		break;
        	case 'file':
        		//link += icons.file[data.media_type];
        		link += icons.default;
        		break;
    		default:
    			link += icons.default;
        	}
        	
        	if(link == "images/box-icons/undefined"){
        		link = "images/box-icons/" + icons.default;
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
        		if(context.selected()[i].id == data.id){
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
        	$("#BOX #loading").show();
        	box.downloadItem(data, function(url){
        		$("#hiddenFrame").attr("src",url);        		
        		$("#BOX #loading").hide();
        	});
        },
        
        openDeleteDiv: function(context, data, event){
        	$("#BOX #deleteItemDiv").toggle();
        	context.deleted(data);
        },
        
        deleteItem: function(context, event){
        	var data = context.deleted();
			$("#BOX #loading").show();
			
			box.deleteItem(data, function(result){
				if(result){
					context.files.remove(data);
					context.selected.remove(data);
				}
				$("#BOX #deleteItemDiv").hide();
				$("#BOX #loading").hide();				
			});
        },
        
        deleteMoreItems: function(context,event){
        	if(context.selected().length == 0){
        		context.toggleDiv('deleteConfirmationDiv');
        		return;
        	}
        	
        	$("#BOX #loading").show();
        	
        	var fileData = context.selected()[0];
        	
    		
        	box.deleteItem(fileData, function(result){
        		if(result){
	        		context.files.remove(fileData);
        		}
	        	context.selected.remove(fileData);
        		
        		
				if(context.selected().length == 0){
					$("#BOX #loading").hide();
					context.toggleDiv('deleteConfirmationDiv');							
				} else {
					context.deleteMoreItems(context,event);
				}
			});
        },
        
        toggleWindow: function(context, event){
        	app.trigger('serviceItem:change',{service:'box',event:'small'});
        },
        
        logout: function(context, event){
        	box.logout();
        	context.selected([]);
        	context.hidden(true);
        	app.trigger('serviceItem:change',{service:'box',event:'logout'});
        },

        upload: function(context, event) {
        	if(context.uploadedFiles().length == 0){
      		  	context.toggleDiv('uploadContentDiv');
        		return;
        	}
        	
        	$("#BOX #loading").show();
        	
        	$("#BOX #uploadDiv button").prop('disabled', true);
        	$("#BOX #uploadDiv input").prop('disabled', true);
            
            var fileData = context.uploadedFiles()[0];
            
            context.getContent(fileData,function(content){
            	box.upload(context.activeFolder().id, content, fileData, function(result){
            		context.uploadedFiles.remove(fileData);
            		
            		if(result.total_count && result.total_count > 0){
            			result.entries[0].service = "box";
            			context.files.push(result.entries[0]);
            		}
            		
            		if(context.uploadedFiles().length == 0){
            			$("#BOX #uploadDiv button").prop('disabled', false);
            			$("#BOX #uploadDiv input").prop('disabled', false);
            			context.toggleDiv('uploadContentDiv');
            			$("#BOX #loading").hide(); 
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
        	$("#BOX #"+div+".popupDiv").toggle();
        },
        
        deleteFromUploadFiles: function(context, item){
        	context.uploadedFiles.remove(item);
        },
        
        openFolder: function(context, item, event){
        	$("#BOX #loading").show();
        	box.listFiles(item, function(files, activeFolder){
        		context.files(files);
        		context.activeFolder(activeFolder);
        		context.selected([]);
        		$("#BOX #loading").hide();
        	});
        },
        
        goToParent: function(context, event){
        	$("#BOX #loading").show();
        	
        	var parent = {id: 0};
        	
        	if(context.activeFolder().parent){
        		parent = context.activeFolder().parent;
        	}
        	
        	box.listFiles(parent, function(files, activeFolder){
        		context.files(files);
        		context.activeFolder(activeFolder);
        		context.selected([]);
        		$("#BOX #loading").hide();
        	});
        },
        
        drop: function(data, model){
        	if(data.service != "box"){
        		$("#BOX #loading").show();
        	
	        	var path = model.activeFolder().path;
	        	
	        	
	        	box.moveFile(data, function(file, name){
	        		model.getContent(file,function(content){
	        			file.name = name;
	                	box.upload(model.activeFolder().id, content, file, function(result){
	                		
	                		if(result.total_count && result.total_count > 0){
	                			result.entries[0].service = "box";
	                			model.files.push(result.entries[0]);
	                			 
	                		}
	                		
	                		$("#BOX #loading").hide();
	                	});
	                });
	        	});
	        }
        },
        
        exportItems: function(context, event){
        	var services = $("#BOX #content #exportDiv #checkDiv .check img.active");
        	for(var i=0;i<services.length;i++){
        		var target = $(services[i]).attr("value");
        		for(var i=0;i<context.selected().length;i++){
        			if(context.selected()[i].type == "folder"){
        				context.selected.remove(context.selected()[i]);
        			}
        		}
        		app.trigger(target+":drop",context.selected());
        	}
        	$("#BOX #content #exportDiv #checkDiv .check img").removeClass("active");
        	context.selected([]);
        	$("#BOX table tbody tr").removeClass("active");
        	context.toggleDiv('exportDiv');
        },
        
        refresh: function(context, event){  
        	$("#BOX #loading").show();
        	
        	box.getUserInfo(function(info){
	        	box.listFiles(context.activeFolder(),function(files, activeFolder){
	        		context.files(files);	        		
	        		context.activeFolder(activeFolder);
	        		$("#BOX table tbody tr").removeClass("active");
	        		context.selected([]);
	        		context.userName(info.name);
	        		$("#BOX #loading").hide();
	    		});
        	
        	});
        },
        
        getOtherServices: ko.observableArray(box.otherServices())
    };
});