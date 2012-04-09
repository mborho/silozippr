/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var request = require('request'),
    sanitize = require('validator').sanitize;


function PubSubHubBub(db) {
    var _db = db;    
    function _connectionWatchdog() {
        if(!_stream) {
            util.log('twitter user stream ended or was destroyed. try reconnecting');
            _streamUser();
            return;
        }        
        setTimeout(_connectionWatchdog, 30000);
    };
    
    function _getSub(res, docId, topic, challenge) {
        _db.get(docId, function(err, doc) {
            console.log(err);
            console.log(doc.url);
            console.log(topic);            
            if(err) {
                res.send(400);
            } else if(doc.url === topic) {
                _db.merge(doc._id, {pubsub: {last_verify: new Date().getTime(), verified:true}}, function(couch_err, couch_res) {
                    if(!couch_err) {
                        console.log(couch_res);
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
    
    return {        
       verify: function(req, res, docId) {
            var mode = (req.query["hub.mode"]) ? sanitize(req.query["hub.mode"]).xss() : false;
            var topic = (req.query["hub.topic"]) ? req.query["hub.topic"] : false;
            var challenge = (req.query["hub.challenge"]) ? sanitize(req.query["hub.challenge"]).xss() : false;
            var lease_seconds = (req.query["hub.lease_seconds"]) ? sanitize(req.query["hub.lease_seconds"]).xss() : false;
            var verify_token = (req.query["hub.verify_token"]) ? sanitize(req.query["hub.verify_token"]).xss() : false;

            console.log('verify: lease_seconds: '+lease_seconds);
            console.log('mode '+mode);
            console.log('docid '+docId);
            console.log('topic '+topic);
            console.log('challenge '+challenge);
            if(!challenge || !mode || !topic) {
                return res.send(400);
            } else if(mode == "subscribe") {
                _getSub(res, docId, topic, challenge);
            } else {
                return res.send(400);
            }            
       }
    }
}

exports.PubSubHubBub = PubSubHubBub;