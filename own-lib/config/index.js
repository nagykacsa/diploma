/**
 * Config module to node.js
 */

var path = require('path');
var filePath = path.join(__dirname,'..','..','config');
var file = "default.json";


var cfg =  function(otherFile, otherFilePath){
	if(otherFile){
		file = otherFile;
	}
	
	if(otherFilePath){
		filePath = otherFilePath;
	}
	
	return require(path.join(filePath,file));
};

module.exports.cfg = cfg;