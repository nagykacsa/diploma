/**
 * Utils services
 */
//exports = UtilsService = {
module.exports = {
    /**
     * visszaadja a restrol visszakapott objektumot,
     * ha 1 elem jön vissza, akkor success és egy json-t ad vissza,
     * ha több elem, akkor success és tömböt ad vissza,
     * ha 'Not Found' jön vissza, akkor success és üres tömböt ad vissza,
     * egyéb esetben success = false és error amit visszaad
     */

    token: '0',
    idp_id: '0',
        
    setToken: function(new_token){
        this.token = new_token;
    },
    
    setId: function(new_id){
        this.idp_id = new_id;
    },
    
    responseErrorHandling : function(obj) {        
        var ret = {};
        
        if(obj == null){
            ret.success = false;
            ret.data = [];
            return ret;
        }else if(typeof obj == 'string'){
            if(obj === ""){
                ret.success = false;
                ret.data = [];
                return ret;
            } else if(obj == 'Not Found') {
                ret.success = false;
                ret.data = [];
                return ret;
            } else if(obj == 'Internal server error') {
                ret.success = false;
                ret.data = [];
                return ret;
            } else {
                ret.success = true;
                ret.data = obj;
                return ret;
            }
        } else if(Object.keys(obj)[0] == '0'){
            
            if(obj.length == 1){
                ret.success = true;
                ret.data = obj[0];
                return ret;
            } else {
                ret.success = true;
                ret.data = [];
                for(var i=0;i<obj.length;i++){
                    ret.data.push(obj[i]);
                }
                return ret;
            }
        } else {
            ret.success = true;
            ret.data = obj;
            return ret;
        }
        
        ret.success = false;
        ret.error = obj;
        return ret;
    },
    
    /**
     * a bemeneti json-t alakítja olyan formába, hogy options.data jsonjében legyenek az adatok.
     */
    
    convertOptions: function(obj){
        
        var options = {};
        options = {};
        for(var key in obj){
            options[key] = obj[key];
        }
        return options;
    },
    
    getHeader: function(){
        return {
            'X-Token': this.token,
            'X-Idp-Id': this.idp_id,
            'Content-Type': 'application/json'
        }
    }
};