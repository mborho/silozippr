/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var FeedLoader = require('./feed').FeedLoader,
    FeedPushed = require('./feed').FeedPushed,
    FeedString = require('./feed').FeedString,
    PubSubHubBub = require('./pubsubhubbub').PubSubHubBub,
    md5 = require('blueimp-md5').md5,
    util = require('util'),
    events = require('events');

var Poller = function(db, conf) {
        
    var self = this;
    var _db = db;
    var _conf = conf;
    var _interval = 1200000;
    var _intervalShort = 10000;
    var _intervalLong = 60000;
    
    function _getNextTime() {
        var d = new Date();
        return Number(d.getTime())+Number(_interval);
    }
    
    function _saveNewDoc(feed, entry) {
        entry.feed = {
                title: feed.title,
                link: feed.link,
                desc: feed.subtitle
            }
        entry.skey = 'poll-'+md5(feed.url);
        entry.feed_url = feed.url;
        entry.type = 'newsitem';
        entry.created_at = new Date().getTime();
        _db.save(entry, function(err, res) {
            util.log(entry.link+ " saved");
        });
    }           
    
    function _updateSubLinks(sub, feed) {
        _db.merge(sub._id, {links: sub.links.slice(-200), conditionals: feed.conditionals}, function(couch_err, couch_res) {
            if(feed.pubSubHub) {
                util.log('handling pubsubhubbub feed');
                var p = new PubSubHubBub(_db,_conf).handleSub(sub, feed,function(err, subscribed) {
                    if(err) util.debug(err);
                    else util.log('poller: subscribed');
                });
            }
            if(couch_err) {
                util.debug('poller: sub link update failed');
                util.debug(couch_err);  
                util.debug(sub);
            }
        });
    }
    
    function _processFeed(err, sub, feed) {
        if(!err && feed) {                
            try {
                var entries = feed.entries.slice(0, 200),
                    max = feed.entries.length;
                entries.reverse();
                for(var x=0;max > x;x++) {
                    if(sub.links && sub.links.indexOf(entries[x].link) < 0) {
                        sub.links.push(entries[x].link);
                        self.emit("saveNewDoc", feed, entries[x]); 
                    }            
                }                
                self.emit("updateSubLinks", sub, feed);
            } catch(e) {
                util.debug(e);     
            }
        } else if(err) {
            util.debug(err);     
        }            
    }
    
    function _processString(pushToken, xml) {
        util.log("pushed: check for pushtoken: "+pushToken);
        _db.view('sources/pushtoken', {key:pushToken,include_docs:true}, function(err, docs) {  
            if(!err) {
                if(docs.length == 1) {
                    var sub = docs[0].doc;
                    util.log("pushed: checking feed: "+ sub.url);
                    var feedPushed = new FeedPushed(sub, xml, function(feedErr, feed) {
                        self.emit("processFeed", feedErr, sub, feed);
                    });
                    feedPushed.process();
                }
            } else {
                util.debug(err);
            }
        });                        
    }
    
    function _fetchFeed(sub) {
        var feed = new FeedLoader({url:sub.url, conditionals:sub.conditionals}, function(err, feed) {
             self.emit("processFeed", err, sub, feed);
        });                            
        feed.load();            
    }
     
    function _setNextCheck(subId) {
        _db.get(subId, function(err, sub) {
            util.log("checking feed: "+sub.url); 
            _db.merge(sub._id, {next_check:_getNextTime()}, function(err, doc) { 
                if(err) { 
                    util.debug('poller: sub next_check update failed');
                    util.debug(sub);
                    util.debug(err);
                } else {
                    _db.get(doc.id, function(err, retimedSub) {
                        self.emit('fetchFeed', retimedSub);
                    });    
                }
            });
        });
    }
    
    function _mainLoop() {
        var query = {limit:1};      
        try {
            _db.view('sources/queue', query, function(err, docs) { 
                if(!err && docs.length > 0 && parseInt(docs[0].key) < new Date().getTime()) {                
                    self.emit("setNextCheck", docs[0].value);
                    setTimeout(_mainLoop, _intervalShort);
                } else {
                    setTimeout(_mainLoop, _intervalLong);
                }
            });
        } catch(err) {
            util.debug(err);
            setTimeout(_mainLoop, _intervalLong);
        }
    }
    
    this.on("setNextCheck", _setNextCheck);
    this.on("fetchFeed", _fetchFeed);
    this.on("processFeed", _processFeed);
    this.on("saveNewDoc", _saveNewDoc);
    this.on("updateSubLinks", _updateSubLinks);
    
    this.start = function() {
        _mainLoop();
    };
    
    this.fromString = function(pushToken, xml) {        
        _processString(pushToken, xml);
    };
}    

util.inherits(Poller, events.EventEmitter);
exports.Poller = Poller;