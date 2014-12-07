define([ 'plugins/router', 'durandal/app', 'knockout', 'api/oneDrive', 'ko-switch-case' ], function(router, app, ko, microsoft, ko_switch_case) {
    
    return {    	
    	files: ko.observableArray([]),
    	activeFolder: ko.observable({name: ""}),
        selected: ko.observableArray([]),
        hidden: ko.observable(true),
        userName: ko.observable(),
        uploadedFiles: ko.observableArray([]),

        activate : function(settings) {
        	var self = this;
        	
        	app.on("microsoft:sizeChange",function(event){
        		self.hidden(event.hidden)
        	});
        	
        	/*self.files.subscribe(function(changes) {
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
        	}, null, "arrayChange");*/
        	
        	microsoft.getUserInfo(function(info){
        		if(info){
        			self.userName(info.name);
        			microsoft.listFiles(function(files, activeFolder){
        				console.log(files);
        				console.log(activeFolder);
                		self.files(files);
                		self.activeFolder(activeFolder);
                		if(files.length > 0){
                			self.hidden(false);
                			app.trigger('serviceItem:change',{service:'microsoft',event:'login'});
                		}
            		});
        		}
        	});
        	
        },
        
        attached: function(){
        	
        },
        
        compositionComplete: function(){
        	var self = this;
        	
        	$('#ONEDRIVE #selectAllDropbox').change(function() {
                if($(this).is(":checked")) {
                	self.selected(self.files());
                	$("#ONEDRIVE table tbody tr").addClass("active");
                } else {
                	self.selected([]);
                	$("#ONEDRIVE table tbody tr").removeClass("active");
                }        
            });
   	
        	$("#ONEDRIVE #uploadDiv").delegate('#Muploader','change', function() {
        		self.upload(self,null);
        		$("#ONEDRIVE #Muploader").val("");
        	});

        },
        
        toggleLoading: function(){
        	
        },
        
        isShared: function(data){
        	if(data.shared_with && data.shared_with.access && data.shared_with.access == "Just me"){
        		return false;
        	}
        	return true;
        },
        
        getDate: function(date){
        	var part = date.split("-");
        	
        	var year = part[0];
        	var month = part[1];
        	
        	part = part[2].split("T");
        	
        	var day = part[0];
        	
        	part = part[1].split(":");
        	
        	var hour = part[0];
        	var min = part[1];
        	
        	var sec = part[2].split("+")[0];
        	
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
        	console.log(context.selected());
        },
        
        downloadItem: function(data, event){
        	$("#ONEDRIVE #loading").show();
        	microsoft.downloadItem(data, function(url){
        		window.open(url);
        		$("#ONEDRIVE #loading").hide();
        	});
        },
        
        deleteItem: function(context, data, event, isConfirm){
        	if(isConfirm == "no"){
        		microsoft.deleteItem(data, function(result){
    				
    			});
        		return;
        	}
        	
    		if(confirm('Are you sure delete this item? ' + data.name)){
    			$("#ONEDRIVE #loading").show();
    			microsoft.deleteItem(data, function(result){
    				console.log("result: ",result);
    				if(result){
    					context.files.remove(data);
    					$("#ONEDRIVE #loading").hide();
    				}
    			});
    		}
        },
        
        deleteMoreItems: function(context,event){
        	if(context.selected().length == 0){
        		context.toggleDiv('deleteConfirmationDiv');
        		return;
        	}
        	
        	var deletedItemNum = 0;
        	for(var i=0;i<context.selected().length;i++){
        		context.files.remove(context.selected()[i]);
	        	microsoft.deleteItem(context.selected()[i], function(result){
					if(result){
						deletedItemNum++;
						if(context.selected().length == deletedItemNum){
							context.selected.removeAll();
							context.toggleDiv('deleteConfirmationDiv');
						}
					}
				});
        	}
        },
        
        toggleWindow: function(context, event){
        	app.trigger('serviceItem:change',{service:'microsoft',event:'small'});
        },
        
        logout: function(context, event){
        	microsoft.logout();
        	context.selected([]);
        	context.hidden(true);
        	app.trigger('serviceItem:change',{service:'microsoft',event:'logout'});
        },

        upload: function(context, event) {  
        	$("#ONEDRIVE #uploadDiv button").prop('disabled', true);
			$("#ONEDRIVE #uploadDiv input").prop('disabled', true);
			$("#ONEDRIVE #message").text("");
        	
		    var newFile = $("#ONEDRIVE #Muploader")[0].files[0];
			
            microsoft.upload(newFile, context.activeFolder(), function(file){
            	if(file){
	            	context.uploadedFiles.push(file);
            	} else {
            		$("#ONEDRIVE #message").text("File is exist!");
            	}
            	$("#ONEDRIVE #uploadDiv button").prop('disabled', false);
    			$("#ONEDRIVE #uploadDiv input").prop('disabled', false);
            });              	
        },
        
        uploadEnd: function(mode, context, event) {
        	if(!mode){
        		for(var i=0;i<context.uploadedFiles().length;i++){
        			context.deleteItem(context, context.uploadedFiles()[i], null, "no");
        		}
        	}
			
			microsoft.listFiles(function(files, activeFolder){
				context.files(files);
				context.activeFolder(activeFolder);
        		context.uploadedFiles.removeAll();
        		context.toggleDiv('uploadContentDiv');
        		$("#ONEDRIVE #message").text("");
    		});
        },
        
        toggleDiv: function(div, context, event){
        	$("#ONEDRIVE #"+div+".popupDiv").toggle();
        },
        
        deleteFromUploadFiles: function(context, item){
        	context.deleteItem(context, item, null, "no");
        	context.uploadedFiles.remove(item);
        },
        
        openFolder: function(context, item, event){
        	microsoft.listFiles(item, function(files, activeFolder){
        		context.files(files);
        		context.activeFolder(activeFolder);
        	});
        },
        
        goToParent: function(context, event){
        	var folders = context.activeFolder().path.split("/");
        	var path = "/";
        	
        	for(var i=1;i<folders.length-1;i++){
        		path += folders[i];
        	}
        	
        	microsoft.listFiles(path, function(files, activeFolder){
        		context.files(files);
        		if(activeFolder.path == ""){
        			activeFolder.path = "root";
        		}
        		context.activeFolder(activeFolder);
        	});
        },
        
        drop: function(data, model){
        	/*if(data.service != "microsoft"){
        	
	        	var path = model.activeFolder().path;
	        	
				if(path == "root"){
					path = "";
				}
	        	microsoft.moveFile(data, path, function(error, newFile){
	        		model.files.push(newFile);
	        	});
	        }*/
        	alert("This is not supported operation!");
        }
    };
});