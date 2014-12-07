var Services = module.exports = {
    get : function(service_name) {
        return require('./' + service_name + '.js');
    }
};