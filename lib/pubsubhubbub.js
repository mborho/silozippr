/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var request = require('request'),
    util = require('util'),
    crypto =  require('crypto'),
    sanitize = require('validator').sanitize;


function PubSubHubBub(db, conf) {
    var _db = db;    
    var _conf = conf;
    
    function _unsubscribe(pushToken, feed, cb) {
        console.log('unsubscribing '+pushToken);
        var callBackHost = _conf.url;
        var params = {
                "hub.callback": callBackHost+'/push/notify/'+pushToken,
                "hub.mode": "unsubscribe", "hub.topic": "http://foo.com", "hub.verify": "async"                
            };
        console.log(params);
        console.log(feed.pubSubHub);
        request.post({uri:feed.pubSubHub, form:params}, function (error, response, body) {
            if(error) {
                console.log(error)
            } else if(response.statusCode == 204) {
                console.log("unsubscribed")
                cb(null, true);
            } else {
                console.log("unsubscription failed")
                cb(response.statusCode+': '+body);
            }
        });                 
    }
    
    function _subscribe(sub, cb) {
        console.log('subscribing '+sub.url+' on '+sub.pubsub.hub +' with token ' +sub.pubsub.token);
        var callBackHost = _conf.url;
        var params = {
                "hub.callback": callBackHost+'/push/notify/'+sub.pubsub.token,
                "hub.mode": "subscribe", "hub.topic": sub.url, "hub.verify": "sync"                
            };
        request.post({uri:sub.pubsub.hub, form:params}, function (error, response, body) {
            if(response.statusCode == 204) {
                console.log("subscribed")
                cb(null, true);
            } else {
                console.log("subscription failed")
                cb(response.statusCode+': '+body);
            }
        });        
    };
    
    function _getSub(res, token, topic, challenge) {
        _db.view('sources/pushtoken', {key:token,include_docs:true}, function(err, docs) {  
            if(err) {
                res.send(400);
            } else if(docs.length == 1 && docs[0].doc.url === topic) {
                var doc = docs[0].doc;
                var pubsub = doc.pubsub;
                pubsub["last_verify"] =  new Date().getTime();
                pubsub["verified"] = true;
                _db.merge(doc._id, {pubsub: pubsub}, function(couch_err, couch_res) {
                    if(!couch_err) {
                        console.log('verified');
                        return res.send(challenge);
                    } else {
                        console.log(couch_err);
                        return res.send(400);
                    }
                });
            } else {
                return res.send(400);
            }
        });
    };
    
    function _doUnsubcribe(res, token, topic, challenge) {
        _db.view('sources/pushtoken', {key:token,include_docs:true}, function(err, docs) {  
            if(err) {
                res.send(400);
            } else if(docs.length == 0) {
                console.log('unsubscription of deleted verified');
                return res.send(challenge);
            } else if(docs.length == 1 && docs[0].doc.url === topic && docs[0].doc.pubsub.unsubscribe === true) {
                console.log('unsubscription verified');
                return res.send(challenge);                
            } else {
                return res.send(400);
            }
        });
    };
    
    return {        
        verify: function(req, res, pushtoken) {
            var mode = (req.query["hub.mode"]) ? sanitize(req.query["hub.mode"]).xss() : false;
            var topic = (req.query["hub.topic"]) ? req.query["hub.topic"] : false;
            var challenge = (req.query["hub.challenge"]) ? sanitize(req.query["hub.challenge"]).xss() : false;
            var lease_seconds = (req.query["hub.lease_seconds"]) ? sanitize(req.query["hub.lease_seconds"]).xss() : false;
            var verify_token = (req.query["hub.verify_token"]) ? sanitize(req.query["hub.verify_token"]).xss() : false;

            console.log('verify: lease_seconds: '+lease_seconds);
            console.log('mode '+mode);
            console.log('pushtoken '+pushtoken);
            console.log('topic '+topic);
            console.log('challenge '+challenge);
            if(!challenge || !mode || !topic) {
                return res.send(400);
            } else if(mode == "subscribe") {
                _getSub(res, pushtoken, topic, challenge);
            } else if(mode == "unsubscribe") {
                _doUnsubcribe(res, pushtoken, topic, challenge);                
            } else {
                return res.send(400);
            }            
        },
        unsubscribe: function(pushToken, feed, cb) {
            _unsubscribe(pushToken, feed, cb);
        },
        handleSub: function(sub, feed, cb) {
            if(feed.pubSubHub) {                
                if(sub.pubsub == undefined) {
                    sub["pubsub"] = {};
                }
                if(sub.pubsub.verified !== true) {  
                    sub["pubsub"]["verified"] = false;
                    sub["pubsub"]["hub"] = feed.pubSubHub;
                    sub["pubsub"]["token"] = crypto.randomBytes(8).toString('hex');
                    _db.merge(sub._id, {pubsub:sub.pubsub}, function(err, res) {                         
                        if(err) console.log(err);
                        else _subscribe(sub,cb);
                    });    
                }
            }
        }
    }
}

exports.PubSubHubBub = PubSubHubBub;