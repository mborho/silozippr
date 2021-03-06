var request  = require('request');

describe('api', function() {
       
    it('verify login failing', function(done) {
        
        var url = 'http://localhost:8990/api/session';        
        request.post({uri:url}, function (error, response, body) {
            if(response.statusCode != 401) {
                done(new Error("Error: Wrong status code, got "+response.statusCode));                            
            } else {
                done(); 
            }
        });         
        
    });

    it('get user data failing', function(done) {
        
        var url = 'http://localhost:8990/api/me';        
        request.get({uri:url}, function (error, response, body) {
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
    
    it('get user data', function(done) {
        
        var url = 'http://localhost:8990/api/me';        
        request.get({uri:url}, function (error, response, body) {
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
    
    it('get toc', function(done) {
        
        var url = 'http://localhost:8990/api/toc/get';        
        request.get({uri:url}, function (error, response, body) {
            var json = JSON.parse(body);            
            if(response.statusCode != 200) {
                done(new Error("Error: Wrong status code, got "+response.statusCode));      
            } else if(json.success != true) {                
                done(new Error("Error: no success, got "+json.success));  
            } else if(json.rows.length == undefined) {
                done(new Error("Error: no rows, got "+json.rows));  
            } else {
                done(); 
            }
        });         
        
    });   
    
    it('get list', function(done) {
        
        var url = 'http://localhost:8990/api/list/docs?format=json';        
        request.get({uri:url}, function (error, response, body) {
            var json = JSON.parse(body);            
            if(response.statusCode != 200) {
                done(new Error("Error: Wrong status code, got "+response.statusCode));      
            } else if(json.success != true) {                
                done(new Error("Error: no success, got "+json.success));  
            } else if(json.html) {
                done(new Error("Error: got html"));                                                  
            } else if(json.docs.length == undefined) {
                done(new Error("Error: no rows, got "+json.rows));              
            } else {
                done(); 
            }
        });         
        
    });    
    
    
    it('get source list', function(done) {
        
        var url = 'http://localhost:8990/api/list/docs?format=json&id=9a3dc72604878894e69a1746da78eb3c';        
        request.get({uri:url}, function (error, response, body) {
            var json = JSON.parse(body);      
            if(response.statusCode != 200) {
                done(new Error("Error: Wrong status code, got "+response.statusCode));      
            } else if(json.success != true) {                
                done(new Error("Error: no success, got "+json.success));  
            } else if(json.html) {
                done(new Error("Error: got html"));                                                  
            } else if(json.docs.length == undefined) {
                done(new Error("Error: no rows, got "+json.rows));                  
            } else {
                done(); 
            }
        });         
        
    });    
    
    it('logout', function(done) {
        
        var url = 'http://localhost:8990/api/logout';        
        request.get({uri:url}, function (error, response, body) {
            if(response.statusCode != 200) {
                done(new Error("Error: Wrong status code, got "+response.statusCode));                   
            } else {
                done(); 
            }
        });         
        
    });    

});    
