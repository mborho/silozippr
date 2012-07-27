/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var util = require('util'),
    events = require('events');

function JobQueue(_db) {    
    
    var self = this    
    var _db = _db;
    var _interval = 1200000;
    var _intervalShort = 10000;
    var _intervalLong = 60000;
    
    function _getNextTime() {
        var d = new Date();
        return Number(d.getTime())+Number(_interval);
    }
    
    function _setNextCheck(subId) {
        _db.get(subId, function(err, sub) {
            util.log("checking feed: "+sub.url); 
            _db.merge(sub._id, {next_check:_getNextTime()}, function(err, doc) { 
                if(err) { 
                    util.debug('queue: sub next_check update failed');
                    util.debug(sub);
                    util.debug(err);
                } else {
                    _db.get(doc.id, function(err, retimedSub) {
                        self.emit("queue.poll", retimedSub);
                    });    
                }
            });
        });
    }
    
    function _mainLoop() {
        var query = {limit:1};      
        try {
            _db.view('sources/queue', query, function(err, docs) { 
                if(docs[0].value.type == "subscription") {
                    if(!err && docs.length > 0 && parseInt(docs[0].key) < new Date().getTime()) {
                        _setNextCheck(docs[0].value._id);
                        setTimeout(_mainLoop, _intervalShort);
                    } else {
                        setTimeout(_mainLoop, _intervalLong);
                    }
                } else if(docs[0].value.type == "unsubscription") {
                    self.emit("queue.unsubscribe", docs[0].value);
                    setTimeout(_mainLoop, _intervalShort);
                }
            });
        } catch(err) {
            util.debug(err);
            setTimeout(_mainLoop, _intervalLong);
        }
    }

    this.start =function() {
        setTimeout(_mainLoop, _intervalShort);
    }                
        
}

util.inherits(JobQueue, events.EventEmitter);
exports.JobQueue = JobQueue;