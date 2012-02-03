/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var Superfeedr = require('superfeedr').Superfeedr,
    md5 = require('blueimp-md5').md5,
    client = false;

function connectionWatchdog() {
    if(client === false) {
        console.log('xmpp watchdog: client false');
    } else if(client.client !== undefined) {
        console.log('xmpp watchdog: '+new Date().toGMTString()+' stream opened: '+client.client.streamOpened);
        if(client.client.streamOpened !== true) {
            console.log(client);   
        }
    }
    setTimeout(connectionWatchdog, 300000);
}

function subscribe(url, cb) {
    console.log('subscribing '+url);    
    if(client) {
        client.subscribe(url, function(err, feed) {
            if (err)  throw new Error(JSON.stringify(err));
            else return cb(feed);
        });              
    } else throw new Error('no xmpp client established');      
}    

function unsubscribe(url, cb) {
    console.log('unsubscribing '+url);    
    if(client) {
        client.unsubscribe(url, function(err, feed) {
            if (err)  throw new Error(JSON.stringify(err));
            else return cb(feed);
        });              
    } else throw new Error('no xmpp client established');      
} 

function getDate(tstamp) {
    var d = new Date();
    return d.setTime(tstamp+'000')
}

function listen(db, conf) {
    client = new Superfeedr(conf.user, conf.password, 'harvey');        
    client.on('connected', function() {
        console.log("connected to superfeedr");
        connectionWatchdog();
        client.on('notification', function(notification) {
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
                        published: getDate(notification.entries[x].postedTime),
                        feed: {
                            title: notification.feed.title,
                            link: notification.feed.url,
                            desc: ''
                        }            
                    }     
                    db.save(doc, function (err, res) {        
                        // Handle response
                        if(err) {
                            console.log(err);
                        }
                    });      
                }            
            }
        });
    });
}
  

exports.listen = listen
exports.subscribe = subscribe
exports.unsubscribe = unsubscribe