define([ 'plugins/router', 'durandal/app', 'knockout', 'api/dropbox', 'ko-switch-case', 'zipjs/zip', 'kodragdrop' ], function(router, app, ko, dropbox, ko_switch_case, zip, kodd) {
    
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

        	app.on("dropbox:sizeChange",function(event){
        		self.hidden(event.hidden)
        	});
        	
        	app.on("dropbox:drop",function(data){
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
        	    	if(left.mimeType == "inode/directory" && right.mimeType=="inode/directory"){
        	    		ret = (left.name == right.name ? 0 : (left.name < right.name ? -1 : 1));
        	    	} else if(left.mimeType == "inode/directory" && right.mimeType!="inode/directory"){
        	    		ret = -1;
        	    	} else if(left.mimeType != "inode/directory" && right.mimeType=="inode/directory"){
        	    		ret = 1;
        	    	} else {
        	    		ret = (left.name == right.name ? 0 : (left.name < right.name ? -1 : 1));
        	    	}        	    	
        	    	return ret;
        	    });
        	}, null, "arrayChange");
        	
        	dropbox.authorize();
        	dropbox.getUserInfo(function(res){
        		if(res){
        			dropbox.listFiles(function(files, activeFolder){
                		self.files(files);
                		if(activeFolder.path == ""){
                			activeFolder.path = "root";
                		}
                		self.activeFolder(activeFolder);
                		if(files.length > 0){
                			self.hidden(false);
                			app.trigger('serviceItem:change',{service:'dropbox',event:'login'});
                		}
                		self.userName(dropbox.getUser().name);
                		self.selected([]);
            		});
        		}
        	});
        	
        },
        
        attached: function(){
        	
        },
        
        compositionComplete: function(){
        	var self = this;
       	
        	$('#DROPBOX #selectAllDropbox').change(function() {
                if($(this).is(":checked")) {
                	self.selected(self.files());
                	$("#DROPBOX table tbody tr").addClass("active");
                } else {
                	self.selected([]);
                	$("#DROPBOX table tbody tr").removeClass("active");
                }        
            });
   	
        	$("#DROPBOX #uploadDiv").delegate('#uploader','change', function() {
        		var array = $("#DROPBOX #uploader")[0].files;
        		
        		for(var i=0;i<array.length;i++){
        			self.uploadedFiles.push(array[i]);
        		}
        		
        		$("#DROPBOX #uploader").val("");
        	});

        },
        
        toggleLoading: function(){
        	
        },
        
        getDate: function(date){        	
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
        		if(context.selected()[i].versionTag == data.versionTag){
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
        	$("#DROPBOX #loading").show();
        	dropbox.downloadItem(data, function(url){  		
        		var link = document.createElement("a");
        	    link.download = name;
        	    link.href = url;
        	    link.click();
        	    
        		$("#DROPBOX #loading").hide();
        	});
        },
        
        openDeleteDiv: function(context, data, event){
        	$("#DROPBOX #deleteItemDiv").toggle();
        	context.deleted(data);
        },
        
        deleteItem: function(context, event){
        	var data = context.deleted();
			$("#DROPBOX #loading").show();
			dropbox.deleteItem(data, function(error,result){
				if(!error){
					context.files.remove(data);
					context.selected.remove(data);
					$("#DROPBOX #deleteItemDiv").hide();
					$("#DROPBOX #loading").hide();					
				}
			});
        },
        
        deleteMoreItems: function(context,event){
        	if(context.selected().length == 0){
        		context.toggleDiv('deleteConfirmationDiv');
        		return;
        	}
        	
        	$("#DROPBOX #loading").show();

    		var fileData = context.selected()[0];
    		
        	dropbox.deleteItem(fileData, function(error, result){
        		context.files.remove(fileData);
        		context.selected.remove(fileData);
        		
				if(context.selected().length == 0){
					$("#DROPBOX #loading").hide();
					context.toggleDiv('deleteConfirmationDiv');
				} else {
					context.deleteMoreItems(context,event);
				}
			});
        },
        
        toggleWindow: function(context, event){
        	app.trigger('serviceItem:change',{service:'dropbox',event:'small'});
        },
        
        logout: function(context, event){
        	dropbox.logout();
        	context.selected([]);
        	context.hidden(true);
        	app.trigger('serviceItem:change',{service:'dropbox',event:'logout'});
        },

        upload: function(context, event) {
        	if(context.uploadedFiles().length == 0){
      		  	context.toggleDiv('uploadContentDiv');
        		return;
        	}
        	
        	$("#DROPBOX #loading").show();
        	
        	$("#DROPBOX #uploadDiv button").prop('disabled', true);
        	$("#DROPBOX #uploadDiv input").prop('disabled', true);
        	
            
            var path = context.activeFolder().path;
            
            if(path == "root"){
            	path = "";
            }
            
        	var fileData = context.uploadedFiles()[0];
        	dropbox.upload(path+"/"+fileData.name,fileData,{},function(error,file){
        		context.files.push(file);
        		context.uploadedFiles.remove(fileData);
        		if(context.uploadedFiles().length == 0){
        			$("#DROPBOX #uploadDiv button").prop('disabled', false);
        			$("#DROPBOX #uploadDiv input").prop('disabled', false);
        			
        			$("#DROPBOX #loading").hide();
        			context.toggleDiv('uploadContentDiv');
        		} else {
        			context.upload(context, event);
        		}
            });                 	
        },
        
        toggleDiv: function(div, context, event){
        	$("#DROPBOX #"+div+".popupDiv").toggle();
        },
        
        deleteFromUploadFiles: function(context, item){
        	context.uploadedFiles.remove(item);
        },
        
        openFolder: function(context, item, event){
        	$("#DROPBOX #loading").show();
        	
        	dropbox.listFiles(item.path, function(files, activeFolder){
        		context.files(files);
        		context.activeFolder(activeFolder);
        		context.selected([]);
        		$("#DROPBOX #loading").hide();
        	});
        },
        
        goToParent: function(context, event){
        	$("#DROPBOX #loading").show();
        	
        	var folders = context.activeFolder().path.split("/");
        	var path = "/";
        	
        	for(var i=1;i<folders.length-1;i++){
        		path += folders[i];
        	}
        	
        	dropbox.listFiles(path, function(files, activeFolder){
        		context.files(files);
        		if(activeFolder.path == ""){
        			activeFolder.path = "root";
        		}
        		context.activeFolder(activeFolder);
        		context.selected([]);
        		$("#DROPBOX #loading").hide();
        	});
        },
        
        drop: function(data, model){
        	if(data.service != "dropbox"){
        		$("#DROPBOX #loading").show();
        		
	        	var path = model.activeFolder().path;
	        	
				if(path == "root"){
					path = "";
				}
	        	dropbox.moveFile(data, path, function(error, newFile){
	        		if(error == "dir"){
	        			alert(newFile);
	        			return;
	        		}
	        		model.files.push(newFile);
	        		$("#DROPBOX #loading").hide();
	        	});
	        }
        },
        
        exportItems: function(context, event){
        	var services = $("#DROPBOX #content #exportDiv #checkDiv .check img.active");
        	for(var i=0;i<services.length;i++){
        		var target = $(services[i]).attr("value");
        		for(var i=0;i<context.selected().length;i++){
        			if(context.selected()[i].isFolder){
        				context.selected.remove(context.selected()[i]);
        			}
        		}
        		app.trigger(target+":drop",context.selected());
        	}
        	$("#DROPBOX #content #exportDiv #checkDiv .check img").removeClass("active");
        	context.selected([]);
        	$("#DROPBOX table tbody tr").removeClass("active");
        	context.toggleDiv('exportDiv');
        },
        
        refresh: function(context, event){  
        	$("#DROPBOX #loading").show();
        	
        	dropbox.getUserInfo(function(res){
        		if(res){
        			var path = context.activeFolder().path;
        			
        			if(path == "root"){
    					path = "";
    				}
        			
        			dropbox.listFiles(path, function(files, activeFolder){
                		context.files(files);
                		if(activeFolder.path == ""){
                			activeFolder.path = "root";
                		}                		
                		
                		context.activeFolder(activeFolder);
                		$("#DROPBOX table tbody tr").removeClass("active");
                		context.selected([]);
                		context.userName(dropbox.getUser().name);
                		$("#DROPBOX #loading").hide();
                	});
        		} else {
        			$("#DROPBOX #loading").hide();
        		}
        	});
        },
        
        getOtherServices: ko.observableArray(dropbox.otherServices())
    };
});