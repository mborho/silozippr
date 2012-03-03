/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var Superfeedr = require('superfeedr').Superfeedr,
    md5 = require('blueimp-md5').md5,
    client = false;

var SuperfeedrClient =  function(db, conf) {
    _conf = conf;
    _db = db;
    _client = false;
    
    function _connectionWatchdog() {
        var timeout = 150000;
        if(_client === false || _client.client.state === 0) {
            console.log("xmpp watchdog: client false");
            _connect();
            timeout = 10000;
        } else {
            console.log("xmpp watchdog: "+new Date().toGMTString()+" state: "+_client.client.state);
        }
        setTimeout(_connectionWatchdog, timeout);
    };
    
    function _getDate(tstamp) {
        var d = new Date();
        return d.setTime(tstamp+'000')
    };
    
    function _connect() {
        _client = new Superfeedr(_conf.user, _conf.password, 'harvey');        
        console.log("superfeedr _connect");
        _client.on('connected', function() {
            console.log("connected to superfeedr");        
            _client.on('notification', function(notification) {
                var date = null,
                    max = 0;
                if(notification.feed !== undefined) {
                    max = notification.entries.length;            
                    for(var x = 0; max > x; x++) {
                        doc = {
                            skey: 'xmpp-'+md5(notification.feed.url),
                            type: 'xmpp',
                            feed_url: notification.feed.url,
                            created_at: new Date().getTime(),
                            //'id':'twitterstream-%d' % status.id,
                            title: notification.entries[x].title,
                            link: notification.entries[x].permalinkUrl,
                            href: notification.entries[x].permalinkUrl,
                            summary: (notification.entries[x].content !== undefined) ? notification.entries[x].content : notification.entries[x].summary,
                            published: _getDate(notification.entries[x].postedTime),
                            feed: {
                                title: notification.feed.title,
                                link: notification.feed.url,
                                desc: ''
                            }            
                        }     
                        _db.save(doc, function (err, res) {        
                            // Handle response
                            if(err) {
                                console.log(err);
                            }
                        });      
                    }            
                }
            });
        });                
    };
    
    return {
        start: function() {
            setTimeout(_connectionWatchdog, 10000);    
            _connect();                        
        },        
        subscribe: function(url, cb) {
            console.log('subscribing '+url);    
            if(_client) {
                _client.subscribe(url, function(err, feed) {
                    if (err)  throw new Error(JSON.stringify(err));
                    else return cb(feed);
                });              
            } else throw new Error('no xmpp client established');      
        },    
        unsubscribe: function (url, cb) {
            console.log('unsubscribing '+url);    
            if(_client) {
                _client.unsubscribe(url, function(err, feed) {
                    if (err)  throw new Error(JSON.stringify(err));
                    else return cb(feed);
                });              
            } else throw new Error('no xmpp client established');      
        }       
    }                           
}

exports.SuperfeedrClient = SuperfeedrClient