define([ 'plugins/router', 'durandal/app', 'knockout', 'api/drive', 'api/dropbox', 'api/oneDrive', 'api/yandex', 'api/box', 'util' ], function(router, app, ko, drive, dropbox, microsoft, yandex, box, util) {
    
    var routes = [
    {
    	route: ['','services'],
    	title: 'Services',
    	moduleId: 'modul/services/index',
    	moduleRootId: 'modul/services',
    	nav: true,
    	hash: '#services',
    	id: 'services'
    },
    /*{
    	route: 'settings',
    	title: 'Settings',
    	moduleId: 'modul/settings/index',
    	moduleRootId: 'modul/settings',
    	nav: true,
    	hash: '#settings',
    	id: 'settings'
    }*/
    ];
    
    return {

        router : router,
        
        visibleService: ko.observableArray([]),
        
        services: ko.observableArray([
                                      {
                                    	  id: "google",
                                    	  name: "Google Drive",
                                    	  img: "images/google_drive_original_button.png"
                                      },
                                      {
                                    	  id: "dropbox",
                                    	  name: "Dropbox",
                                    	  img: "images/dropbox_button.png"
                                      },
                                      {
                                    	  id: "yandex",
                                    	  name: "Yandex.Disk",
                                    	  img: "images/yandex-disk-.png"
                                      },
                                      {
                                    	  id: "box",
                                    	  name: "Box",
                                    	  img: "images/box-icon.png"
                                      }
                                      ]),
        activeServiceCount: 0,
        selectedService: "",
        
        activate : function() {
            /*router.createChildRouter = function() {
                var childRouter = createRouter();
                childRouter.parent = router;
                return childRouter;
            };

            var routes_temp = JSON.parse(JSON.stringify(routes));

            $.each(routes_temp, function(index, route) {
                if (route.childRoutes === undefined) {
                    return;
                }

                $.each(route.childRoutes, function(index, childRoute) {
                    childRoute.route = route.route + '/' + childRoute.route;
                    childRoute.moduleId = route.moduleRootId + '/' + childRoute.moduleId;
                    childRoute.title = childRoute.title;
                    childRoute.hash = route.hash + '/' + childRoute.hash;
                    childRoute.parent = route.route;
                    childRoute.level = childRoute.level;
                });

                routes_temp = routes_temp.concat(route.childRoutes);
            });
            console.log(routes_temp);
            router.map(routes_temp).buildNavigationModel();

            return router.activate();*/
        	
        	var self = this;
        	
        	app.on('serviceItem:change').then(function(options){
        		var elem = self.getElem(options.service);
				
				if(elem == "elem"){
					return;
				}
				
				switch(options.event){
				case 'login':
					elem.removeClass("small");
					elem.addClass("active");
					self.activeServiceCount++;
					if(self.activeServiceCount > 2){
						app.trigger('serviceItem:change',{service:options.service,event:"small"});
					} else {
						self.visibleService.push(self.getService(options.service));
					}
					break;
				case 'small':
					elem.removeClass("active");
					elem.addClass("small");
					app.trigger(options.service+":sizeChange",{hidden: true});
					break;
				case 'big':
					elem.removeClass("small");
					elem.addClass("active");
					
					if(self.visibleService().length > 1){
						$("#serviceChooser").show();
					}
					
					//self.visibleService.push(self.getService(options.service));
					
					app.trigger(options.service+":sizeChange",{hidden: false});
					break;
				case 'logout':
					elem.removeClass("small");
					elem.removeClass("active");
					self.activeServiceCount--;
					self.visibleService.remove(self.getService(options.service));
					break;
				}
        	});
        },
        
        compositionComplete: function(){    
        	/*if(window.location.hash == ""){
        		$("#services").addClass("active");
        	} else {
        		$('#'+window.location.hash.replace("#","")).addClass('active');
        	}
        	
        	$(".menuitem").click(function(){
        		$(".menuitem").removeClass('active');
        		$(this).addClass('active');
        		window.location.hash = "#"+$(this).attr("id");
        	});*/
        	var self = this;
        	
        	$("#SHELL #serviceDiv div.scrollableTable").height($(window).height()-125);
        	
        	$("#googleConnect").click(function(){
        		if(self.isLoggedIn("google")){
        			app.trigger('serviceItem:change',{service:'google',event:self.getGoodEvent('google')});
        			selectedService = "google";
        		} else {
        			drive.login();
        		}
        	});
        	
        	$("#dropboxConnect").click(function(){
        		if(self.isLoggedIn("dropbox")){
        			app.trigger('serviceItem:change',{service:'dropbox',event:self.getGoodEvent('dropbox')});
        			selectedService = "dropbox";
        		} else {
        			dropbox.login();
        		}
        	});
        	
        	$("#oneDriveConnect").click(function(){
        		if(self.isLoggedIn("microsoft")){
        			//app.trigger('serviceItem:change',{service:'microsoft',event:self.getGoodEvent('microsoft')});
        		} else {
        			//microsoft.login();
        		}
        	});
        	
        	$("#yandexConnect").click(function(){
        		if(self.isLoggedIn("yandex")){
        			app.trigger('serviceItem:change',{service:'yandex',event:self.getGoodEvent('yandex')});
        			selectedService = "yandex";
        		} else {
        			yandex.login();
        		}
        	});
        	
        	$("#boxConnect").click(function(){
        		if(self.isLoggedIn("box")){
        			app.trigger('serviceItem:change',{service:'box',event:self.getGoodEvent('box')});
        			selectedService = "box";
        		} else {
        			box.login();
        		}
        	});
        },
        
        getElem: function(service){
        	var elem = "elem";
			switch(service){
			case 'google':
				elem = $("#googleConnect");
				break;
			case 'dropbox':
				elem = $("#dropboxConnect");
				break;
			case 'microsoft':
				elem = $("#oneDriveConnect");
				break;
			case 'yandex':
				elem = $("#yandexConnect");
				break;
			case 'box':
				elem = $("#boxConnect");
				break;
			}

			return elem;
        },
        
        isLoggedIn: function(service){
        	var cookie = "bdsrstnt";
        	switch(service){
        	case 'google':
        		cookie = "google_token";
        		break;
        	case 'dropbox':
        		cookie = "dropbox_token";
        		break;
        	case 'microsoft':
        		cookie = "microsoft_token";
        		break;
        	case 'yandex':
        		cookie = "yandex_token";
        		break;
        	case 'box':
        		cookie = "box_token";
        		break;
        	}        	
        	
        	if(cookie == "bdsrstnt"){
        		return false;
        	}
        	
        	try {
    			var token = JSON.parse(util.getCookie(cookie));
    			return true;
    		} catch(e) {
    			return false;
    		}
        },
        
        getGoodEvent: function(service){
        	var elem = this.getElem(service);
        	var event = "event";
        	if(elem == "elem"){
        		return event;
        	}
        	
        	if(elem.hasClass("small")){
        		event = "big";
        	} else {
        		event = "small";
        	}
        	return event;
        },
        
        getService: function(id){
        	for(var i=0;i<this.services().length;i++){
        		if(this.services()[i].id == id){
        			return this.services()[i];
        		}
        	}
        },
        
        closePopup: function(e,f,g){
        	app.trigger("serviceItem:change",{service: selectedService, event: "small"});
        	$("#serviceChooser").hide();
        },
        
        changeService: function(context,data,event){
        	context.visibleService.remove(data);
        	app.trigger("serviceItem:change",{service: data.id, event: "small"});
        	$("#serviceChooser").hide();
        	context.changeVisible();
        },
        
        changeVisible: function(){
        	var elements = $(".serviceItem");
        	this.visibleService.removeAll();
        	for(var i=0;i<elements.length;i++){
        		if($(elements[i]).hasClass("active")){
        			var id = $(elements[i]).attr("id").split("Connect")[0];
        			this.visibleService.push(this.getService(id));
        		}
        	}
        }
    };
});