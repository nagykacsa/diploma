var services = require("../services/index");

module.exports = function(app) {
	
	app.get("/", function(req,res){
		res.render("../../public/views/index.html");
	});
}