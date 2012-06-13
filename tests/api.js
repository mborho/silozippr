var request  = require('request');

describe('api', function() {
       
    it('verify login failing', function(done) {
        
        var url = 'http://localhost:8990/api/session';        
        request({uri:url, method:"POST"}, function (error, response, body) {
            if(response.statusCode != 401) {
                done(new Error("Error: Wrong status code, got "+response.statusCode));                            
            } else {
                done(); 
            }
        });         
        
    });

    it('verify login', function(done) {
        
        var url = 'http://localhost:8990/api/session';        
        request.post({uri:url, form: {username:"test", password:"test"}}, function (error, response, body) {
            var json = JSON.parse(body);
            if(response.statusCode != 200) {
                done(new Error("Error: Wrong status code, got "+response.statusCode));    
            } else if(json.id != "test") {                
                done(new Error("Error: Wrong username, got "+json.id));                
            } else {
                done(); 
            }
        });         
        
    });
    
});    
