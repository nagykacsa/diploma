define([ 'plugins/router', 'durandal/app', 'knockout', 'api/drive', 'ko-switch-case', 'zipjs/zip', 'jquery-ui', 'kodragdrop' ], function(router, app, ko, drive, ko_switch_case, zip, jqueryui, kodd) {
    
    return {    	
    	files: ko.observableArray([]),
        activeFolderItems: ko.observableArray([]),
        activeFolder: ko.observable({title:'root'}),
        selected: ko.observableArray([]),
        hidden: ko.observable(true),
        userName: ko.observable(),
        uploadedFiles: ko.observableArray([]),
        deleted: ko.observable(),

        activate : function(settings) {
        	var self = this;
        	
        	app.on("google:sizeChange",function(event){
        		self.hidden(event.hidden)
        	});
        	
        	app.on("google:drop",function(data){
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
        	
        	self.activeFolderItems.subscribe(function(changes) {
        	    self.activeFolderItems().sort(function(left, right) {
        	    	var ret = 0;
        	    	if(left.mimeType == "application/vnd.google-apps.folder" && right.mimeType=="application/vnd.google-apps.folder"){
        	    		ret = (left.title == right.title ? 0 : (left.title < right.title ? -1 : 1));
        	    	} else if(left.mimeType == "application/vnd.google-apps.folder" && right.mimeType!="application/vnd.google-apps.folder"){
        	    		ret = -1;
        	    	} else if(left.mimeType != "application/vnd.google-apps.folder" && right.mimeType=="application/vnd.google-apps.folder"){
        	    		ret = 1;
        	    	} else {
        	    		ret = (left.title == right.title ? 0 : (left.title < right.title ? -1 : 1));
        	    	}        	    	
        	    	return ret;
        	    });
        	}, null, "arrayChange");
        	
        	drive.authorize();
        	drive.getUserInfo();
        	drive.listFiles(function(files){
        		self.files(files);
        		self.activeFolderItems(files);
        		if(files.length > 0){
        			self.hidden(false);
        			app.trigger('serviceItem:change',{service:'google',event:'login'});
        		}
        		self.userName(drive.getUser().name);
        		self.selected([]);
        		self.activeFolder({title:"root",id:drive.getRootId()});
    		});
        },
        
        attached: function(){
        	
        },
        
        compositionComplete: function(){
        	var self = this;
        	
        	$('#GOOGLE #selectAllGoogle').change(function() {
                if($(this).is(":checked")) {
                	self.selected(self.activeFolderItems());
                	$("#GOOGLE table tbody tr").addClass("active");
                } else {
                	self.selected([]);
                	$("#GOOGLE table tbody tr").removeClass("active");
                }        
            });
        	
        	$("#GOOGLE #uploadDiv").delegate('#uploader','change', function() {
        		var array = $("#GOOGLE #uploader")[0].files;
        		
        		for(var i=0;i<array.length;i++){
        			self.uploadedFiles.push(array[i]);
        		}

        		$("#GOOGLE #uploader").val("");
        	});    	
        },
        
        getDate: function(date){
        	var ret = "";
        	
        	var d1 = date.split("-");
        	ret += d1[0] + ". " + d1[1] + ". ";
        	
        	var d2 = d1[2].split("T");
        	ret += d2[0] + ". ";
        	
        	var d3 = d2[1].split(".");
        	ret += d3[0];
        	
        	return ret;
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
        
        downloadItem: function(service, data, event){
        	$("#hiddenFrame").attr("src",data.webContentLink);
        },
        
        openDeleteDiv: function(context, data, event){
        	$("#GOOGLE #deleteItemDiv").toggle();
        	context.deleted(data);
        },
        
        deleteItem: function(context, event){
        	var data = context.deleted();
        	$("#GOOGLE #loading").show();
        	
			drive.deleteItem(data, function(result){
				if(result){
					context.activeFolderItems.remove(data);
					context.selected.remove(data);
					context.activeFolderItems(context.activeFolderItems());
					drive.listFiles(function(files){
						context.files(files);
						$("#GOOGLE #deleteItemDiv").hide();
						$("#GOOGLE #loading").hide();
		    		});
				}
			});
        },
        
        deleteMoreItems: function(context,event){
        	if(context.selected().length == 0){
        		context.toggleDiv('deleteConfirmationDiv');
        		return;
        	}
        	
        	$("#GOOGLE #loading").show();
        	
        	drive.deleteItem(context.selected()[0], function(result){
				if(result){
					context.activeFolderItems.remove(context.selected()[0]);
					context.activeFolderItems(context.activeFolderItems());
					context.selected.remove(context.selected()[0]);
					
					if(context.selected().length == 0){
						context.toggleDiv('deleteConfirmationDiv');
						
						drive.listFiles(function(files){
							context.files(files);
							$("#GOOGLE #loading").hide();
			    		});
					} else {
						context.deleteMoreItems(context,event);
					}
				}
			});        	
        },
        
        toggleWindow: function(context, event){
        	app.trigger('serviceItem:change',{service:'google',event:'small'});
        },
        
        logout: function(context, event){
        	drive.logout();
        	context.selected([]);
        	context.hidden(true);
        	app.trigger('serviceItem:change',{service:'google',event:'logout'});
        },
        
        createFolder: function(context, event){
        	var name = $("#GOOGLE #createFolderDiv input").val();
        	if (name == ""){
        		return;
        	}
        	
        	const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";
        	
        	var fileData = {
        			mimeType: "application/vnd.google-apps.folder",
        			title: name,
        			//description: "Created folder through Diploma 1.0",
        			parents: [{
                    	id: context.activeFolder().id
                    }]
        	};
        	
        	drive.uploadFolder(fileData,function(folder,err1,err2,err3){

        	});
        	
        },

        upload: function(context, event) {
        	if(context.uploadedFiles().length == 0){
      		  	context.toggleDiv('uploadContentDiv');
        		return;
        	}
        	
        	$("#GOOGLE #loading").show();
        	
        	$("#GOOGLE #uploadDiv button").prop('disabled', true);
        	$("#GOOGLE #uploadDiv input").prop('disabled', true);
        	
            var fileData = context.uploadedFiles()[0];
            
            context.getMultipart(fileData,context,function(multipartRequestBody,boundary){
            	drive.upload(multipartRequestBody, boundary, function(file){
              	  context.uploadedFiles.remove(context.uploadedFiles()[0]);
              	  context.activeFolderItems.splice(0,0,file);
              	  
              	  if(context.uploadedFiles().length == 0){
      	              	
      	              $("#GOOGLE #uploadDiv button").prop('disabled', false);
      	              $("#GOOGLE #uploadDiv input").prop('disabled', false);
      	              
              		  context.toggleDiv('uploadContentDiv');
              		  
              		  drive.listFiles(function(list){
      						context.files(list);
      						$("#GOOGLE #loading").hide();
              		  });	            		  
              	  } else {
              		  context.upload(context,event);
              	  }
                });
            });        	
        },
        
        getMultipart: function(fileData, context, cb){
        	const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            var reader = new FileReader();
            
            reader.readAsBinaryString(fileData);
            reader.onload = function(e) {
              var contentType = fileData.type || 'application/octet-stream';
              var metadata = {
                title: fileData.name,
                mimeType: contentType,
                description: fileData.description || "Uploaded file through Diploma 1.0",
                parents: [{
                	id: context.activeFolder().id
                }]
              };
              
              var base64Data = btoa(reader.result);
              var multipartRequestBody =
                  delimiter +
                  'Content-Type: application/json\r\n\r\n' +
                  JSON.stringify(metadata) +
                  delimiter +
                  'Content-Type: ' + contentType + '\r\n' +
                  'Content-Transfer-Encoding: base64\r\n' +
                  '\r\n' +
                  base64Data +
                  close_delim;
              
              	cb (multipartRequestBody,boundary);
            }
        },
        
        toggleDiv: function(div, context, event){
        	$("#GOOGLE #"+div).toggle();
        },
        
        deleteFromUploadFiles: function(context, item){
        	context.uploadedFiles.remove(item);
        },
        
        openFolder: function(context, item, event){
        	$("#GOOGLE #loading").show();
        	context.activeFolder(item);
        	context.activeFolderItems(item.items);
        	context.selected([]);
        	$("#GOOGLE #loading").hide();
        },
        
        goToParent: function(context, event){
        	$("#GOOGLE #loading").show();
        	
        	if(context.activeFolder().parents.length == 0 || context.activeFolder().parents[0].isRoot){
        		context.activeFolder({title:"root",id:drive.getRootId()});
        		context.activeFolderItems(context.files());
        	} else {
        		var folders = drive.getFolders();
        		for(var i=0;i<folders.length;i++){
        			if(folders[i].id == context.activeFolder().parents[0].id){
        				context.activeFolder(folders[i]);
        				context.activeFolderItems(folders[i].items);
        				break;
        			}
        		}
        	}
        	context.selected([]);
        	$("#GOOGLE #loading").hide();
        },
        
        drop: function(data, model){
			if(data.service != "google"){
				$("#GOOGLE #loading").show();
				var parent = model.activeFolder().id;
				drive.moveFile(data, parent, function(fileData, name){
					if(!fileData){
						alert(name);
						$("#GOOGLE #loading").hide();
						return;
					}
					fileData.name = name;
					
					model.getMultipart(fileData,model,function(multipartRequestBody,boundary){
						drive.upload(multipartRequestBody, boundary, function(file){
							model.activeFolderItems.splice(0,0,file);
							drive.listFiles(function(list){
								model.files(list);
								$("#GOOGLE #loading").hide();
							});            	 
						});
					});					
				});
			}
        },
        
        exportItems: function(context, event){
        	var services = $("#GOOGLE #content #exportDiv #checkDiv .check img.active");
        	for(var i=0;i<services.length;i++){
        		var target = $(services[i]).attr("value");
        		for(var i=0;i<context.selected().length;i++){
        			if(context.selected()[i].mimeType == "application/vnd.google-apps.folder"){
        				context.selected.remove(context.selected()[i]);
        			}
        		}
        		app.trigger(target+":drop",context.selected());
        	}
        	$("#GOOGLE #content #exportDiv #checkDiv .check img").removeClass("active");
        	context.selected([]);
        	$("#GOOGLE table tbody tr").removeClass("active");
        	context.toggleDiv('exportDiv');
        },
        
        refresh: function(context, event){  
        	$("#GOOGLE #loading").show();
        	
        	drive.getUserInfo();
        	drive.listFiles(function(files){
        		context.files(files);
        		for(var i=0;i<files.length;i++){
        			if(context.activeFolder().id == files[i].id){
        				context.activeFolderItems(files[i].items);
        			}
        		}

        		context.userName(drive.getUser().name);
        		$("#GOOGLE table tbody tr").removeClass("active");
        		context.selected([]);
        		
        		$("#GOOGLE #loading").hide();
    		});
        },
        
        getOtherServices: ko.observableArray(drive.otherServices())
    }
});