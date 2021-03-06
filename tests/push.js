var request  = require('request'),
    storage = require('../lib/storage'),
    nconf = require('nconf'),
    PubSubHubBub = require('../lib/pubsubhubbub').PubSubHubBub,
    subscription  = require('../lib/feed.js');    
    
nconf.use('file', { file: __dirname+'/../config.json' });
nconf.load();


describe('pUSH', function(){
    var db = null;
    var testSub = {
        _id: 'testsub',
        url: 'http://borho.net/dummy.php',
        skey: 'bacfb6cc1d3818e4ead1cf1b1c2444444',
        type: 'subscription',
        pubsub: {
            verified: false,
            last_verify: 0,
            token: "f6904611d12cc33b"
        }
    }
    before(function(done) {
        db = storage.getDb(nconf.get('db'), false);
        db.save(testSub._id, testSub, function (err, res) {
            if(err) {
                done(new Error("Error: "+err));                            
            }
            done();
        });        
    });
    after(function(done) {                    
        db.get(testSub._id, function(err, doc) {
            db.remove(doc._id, doc._rev, function(err, doc) {
                done();
            });
        });        
    });
    
    it('verify unroute', function(done){
        
        var url = 'http://localhost:8990/push/notify';        
        request({uri:url, method:"GET"}, function (error, response, body) {
            if(response.statusCode !== 404) {
                done(new Error("Error: Wrong status code, got "+response.statusCode));                            
            } else {
                done(); 
            }
        });                                           
    });
 
    it('verify unroute - missing mode', function(done){
        var query = '?hub.topic='+encodeURIComponent(testSub.url);
        var url = 'http://localhost:8990/push/notify/'+testSub.pubsub.token+query;        
        request({uri:url, method:"GET"}, function (error, response, body) {
            if(response.statusCode !== 400) {
                done(new Error("Error: Wrong status code, got "+response.statusCode));                            
            } else {
                done(); // Success. No error for now.
            }
        });                                           
    });
        
        
    it('verify unroute - missing topic', function(done){
        var query = '?hub.mode=subscribe' 
//                     + '&hub.topic='+encodeURIComponent(testSub.url);
                    +'';
        var url = 'http://localhost:8990/push/notify/'+testSub.pubsub.token+query;        
        request({uri:url, method:"GET"}, function (error, response, body) {
            if(response.statusCode !== 400) {
                done(new Error("Error: Wrong status code, got "+response.statusCode));                            
            } else {
                done(); // Success. No error for now.
            }
        });                                           
    });
    
    it('verify unroute - missing challenge', function(done){
        var query = '?hub.mode=subscribe' 
                    + '&hub.topic='+encodeURIComponent(testSub.url);
                    +'';
        var url = 'http://localhost:8990/push/notify/'+testSub.pubsub.token+query;        
        request({uri:url, method:"GET"}, function (error, response, body) {
            if(response.statusCode !== 400) {
                done(new Error("Error: Wrong status code, got "+response.statusCode));                            
            } else {
                done(); // Success. No error for now.
            }
        });                                           
    });  
    
    it('verify route', function(done){
        var query = '?hub.mode=subscribe' 
                    + '&hub.topic='+encodeURIComponent(testSub.url)
                    + '&hub.challenge=foobla';
        var url = 'http://localhost:8990/push/notify/'+testSub.pubsub.token+query;        

        request({uri:url, method:"GET"}, function (error, response, body) {
            if(response.statusCode !== 200) {
                done(new Error("Error: Wrong status code, got "+response.statusCode));                            
            } else if(body !== "foobla") {
                done(new Error("Error: Wrong challenge response, got "+body));                                            
            } else {
                done(); // Success. No error for now.
            }
        });                                           
    });
    
    it('check last_verify', function(done){
        db.get(testSub._id, function(err, doc) {
            if(doc.pubsub.last_verify === testSub.pubsub.last_verify) {
                done(new Error("Error: last_verify not set, got" +doc.pubsub.last_verify));          
            } else if(doc.pubsub.verified !== true) {
                done(new Error("Error: pubsub.verified not true"));                    
            } else {
                done();
            }            
        });                                 
    });    
    
    it('check sub with pubsubhubbub', function(done) {
        function cb(err, feed) {                    
            var pubSubHubBub = new PubSubHubBub(db, nconf.get('app'));
            pubSubHubBub.handleSub(testSub, feed, function(err, action) {
                if(err) {
                    done(new Error("Error occured"));                        
                } else if(action !== true) {
                    done(new Error("Subcription not true"));                        
                } else {
                    done();
                }                              
            });
            
        }
        var feed = new subscription.FeedLoader(testSub.url, cb)        
        feed.load();                     
    });
      
});   

// OKmartin@v220110487425373:~/node-dev/silozippr$ curl -H "Content-Type: application/json" -d '{"bla":"fasel"}' http://couch.borho.net:8990/push/notify/testsub