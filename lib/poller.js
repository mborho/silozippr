/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var FeedLoader = require('./feed').FeedLoader,
    FeedPushed = require('./feed').FeedPushed,
    PubSubHubBub = require('./pubsubhubbub').PubSubHubBub,
    md5 = require('blueimp-md5').md5;

var Poller = function(db, conf) {
    var _db = db;
    var _conf = conf;
    var _interval = 1200000;
    var _interval_short = 10000;
    var _interval_long = 60000;
    
    function _get_next_time() {
        var d = new Date();
        console.log(d.toGMTString());
        return Number(d.getTime())+Number(_interval);
    }
    
    function _save_new_doc(feed, entry) {
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
            console.log(entry.link+ " saved");
        });
    }           
    
    function _process_feed(err, sub, feed) {
        console.log('process_feed');
        if(!err && feed) {                
            try {
                var entries = feed.entries.slice(0, 200),
                    max = feed.entries.length,
                    conditionals = feed.conditionals;
                entries.reverse();
                for(var x=0;max > x;x++) {
                    if(sub.links && sub.links.indexOf(entries[x].link) < 0) {
                        sub.links.push(entries[x].link)
                        _save_new_doc(feed, entries[x]);
                    }            
                }                
                _db.merge(sub._id, {links: sub.links.slice(-200), conditionals:conditionals}, function(couch_err, couch_res) {
                    if(feed.pubSubHub) {
                        util.log('handling pubsubhubbub feed');
                        new PubSubHubBub(_db,_conf).handleSub(sub, feed,function(err, subscribed) {
                            if(err) console.log(err);
                            else console.log('poller: subscribed');
                        });
                    }
                    if(couch_err) {
                        console.log('poller: sub link update failed');
                        console.log(couch_err);                  
                        console.log(sub);                            
                    }
                });
            } catch(e) {
                console.log(e);     
            }
        } else if(err) {
            console.log(err);
        }            
    }
    
    function _process_string(subId, xml) {
        _db.get(subId, function(err, sub) {
            if(!err) {
                var feedPushed = new FeedPushed(sub, xml, function(err, feed) {
                    _process_feed(err, sub, feed);
                });
                feedPushed.process();
            } else console.log(err);
        });                        
    }
    
    function _fetch_feed(sub) {
        var feed = new FeedLoader({url:sub.url, conditionals:sub.conditionals}, function(err, feed) {
             _process_feed(err, sub, feed);
        });                            
        feed.load();            
    }
     
    function _main_loop() {
        var query = {limit:1};       
        try {
            _db.view('sources/queue', query, function(err, docs) { 
                if(!err && docs.length > 0 && parseInt(docs[0].key) < new Date().getTime()) {                
                    _db.get(docs[0].value, function(err, sub) {
                        console.log("checking feed: "+sub.url);                
                        _db.merge(sub._id, {next_check:_get_next_time()}, function(err, doc) { 
                            if(err) {                                
                                console.log('poller: sub next_check update failed');
                                console.log(err);  
                                console.log(sub);
                            } else {
                                _db.get(doc.id, function(err, retimedSub) {                                    
                                    _fetch_feed(retimedSub);
                                });    
                            }
                        });
                    });
                    setTimeout(_main_loop, _interval_short);
                } else {
                    setTimeout(_main_loop, _interval_long);
                }
            });
        } catch(err) {
            console.log(err);       
            setTimeout(_main_loop, _interval_long);
        }
    }
    
    return {
        start: function() {
            _main_loop()
        },
        fromString: function(subId, xml) {
            _process_string(subId, xml);
        }
    }    
}    

exports.Poller = Poller;