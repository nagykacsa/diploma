define([ 'plugins/router', 'durandal/app', 'knockout', 'api/drive', 'api/dropbox', 'ko-switch-case', 'jquery-ui', 'api/oneDrive' ], function(router, app, ko, drive, dropbox, ko_switch_case, jqueryui, oneDrive) {
    
    return {
    	google: ko.observable(),
    	
    	/*google: {
    		files: ko.observableArray([]),
            activeFolder: ko.observableArray([]),
            selected: ko.observableArray([]),
    	},*/
    	
        activate : function() {
        	var self = this;
        },
        
        attached: function(){
        	
        },
        
        compositionComplete: function(){
        	var self = this;
        	
        	$("#driveConnect").click(function(){
        		drive.login();
        	});
        	
        	$("#dropboxConnect").click(function(){
        		dropbox.login();
        	});
        	
        	$("#oneDriveConnect").click(function(){
        		oneDrive.login();
        	});
        }
    };
});