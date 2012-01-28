/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var renderer =  require('./tools/renderer')
    , superfeedr = require('./superfeedr-client')
    , FeedLoader = require('./feed').FeedLoader;    
    
var Connector = function(db) {
    this.db = db;
    this.list_limit = 20;
}

Connector.prototype.remove_doc = function(socket, doc) {
    console.log('removing '+doc._id+' rev:'+doc._rev);
    this.db.remove(doc._id, doc._rev, function(err, docs) {
        var res = !res;
        return socket.emit('removeDocResult', {success: res, doc:doc});                        
    });       
}   

Connector.prototype.remove_docs = function(socket, data) {
    var max = data.docs.length,
        bulk= JSON.stringify({'docs':data.docs})
        res = true;    
    console.log('removing '+max+' docs');        
    this.db.save(data.docs, function() {
        return socket.emit('removeDocsResult', {success: true, deleted: data.docs, all:data.all});                                 
    });
}    

Connector.prototype.get_index_docs = function(res, startkey) {
    var limit = this.list_limit,
        start = (startkey) ? JSON.parse(startkey) : false,
        query = {
            descending: true,
            limit: limit + 1
        };     
    if(start !== false) {
        query.startkey=start[0];
        query.startkey_docid=start[1];
    }
    this.db.view('sources/all', query, function(err, docs) {  
        if (err) throw new Error(JSON.stringify(err));        
        renderer.list(docs, true, limit, (startkey !== false), res);                     
    });    
}

Connector.prototype.get_source_docs = function(res, skey, startkey) { 
    var limit = this.list_limit,
        start = (startkey) ? JSON.parse(startkey) : false,
        query = {            
            descending: true,
            startkey: [skey,((start) ? start[0]: {})],
            endkey: [skey],
            limit: limit + 1,
            startkey_docid: ((start) ? start[1] : '')
        };
    this.db.view('sources/by_feed_link', query, function(err, docs) {
        if (err) throw new Error(JSON.stringify(err));
        renderer.list(docs, false, limit, (startkey !== false), res);                                      
    });
}

Connector.prototype.process_pushed = function(doc, pipe) {     
    var processed = {skey: doc.skey, html: '', feed: { title: doc.feed.title }};
    processed.html = renderer.pushed(doc);
    pipe.emit('news', { doc: processed });
}

Connector.prototype.get_toc = function(res) {   
    var query = {
        group: true
    }
    this.db.view('sources/toc', query, function(err, docs) {        
        var rows = [];
        if (err) throw new Error(JSON.stringify(err));
        var success = !err;       
        
        function compare(a,b) {
            if (a.value < b.value) return 1;
            if (a.value > b.value) return -1;
            return 0;
        }
        return res.json({success: success, rows: docs.rows.sort(compare)});                      
    });        
}    

Connector.prototype.add_sub = function(req, res, superfeedr_enabled){
    var db = this.db;
    function isUrl(s) {
        var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
        return regexp.test(s);
    }
    
    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    if(isUrl(req.body.feed_url ) && isNumber(req.body.step)) {
        var new_url = req.body.feed_url,
            handler = (req.body.handler !== undefined) ? req.body.handler : false,  
            feed = new FeedLoader(new_url, function(err, feed) {
            if (err) {
                console.log(err)
                throw new Error(JSON.stringify(err));
            } else {
                if(feed.valid === true) {
                    var response = {
                            success:true, 
                            step: parseInt(req.body.step), 
                            valid: feed.valid, 
                            pubsubhub: ((superfeedr_enabled === true) ? feed.pubSubHub: false), 
                            title: feed.title, 
                            handler: handler,
                            saved: false
                        },
                        doc = {
                            type: "subscription", 
                            url: feed.url, 
                            title: feed.title, 
                            skey: feed.skey,
                            creates: ((response.handler=='superfeedr') ? 'xmpp' : 'newsitem'), 
                            next_check: new Date().getTime(),
                            links: []
                        };
                    if(response.step == 1 && superfeedr_enabled ) {
                        res.json(response); 
                    } else if(response.step == 2 || superfeedr_enabled !== true) {                
                        console.log('save subscription');           
                        response.saved = true;
                        if(response.handler == 'superfeedr') {
                            superfeedr.subscribe(doc.url, function(notification) {
                                db.save('sub-'+feed.skey, doc, function(couch_err, couch_res) {
                                    res.json(response); 
                                });  
                            });
                        } else {
                            db.save('sub-'+feed.skey, doc, function(couch_err, couch_res) {
                                res.json(response); 
                            });   
                        }
                    }
                } else {
                    var response = {success:false, valid: feed.valid};
                    res.json(response); 
                }
            }    
        });                            
        feed.load();
    } else {
        var response = {success: false, valid: false, msg: "Url invalid"}  
        return res.json(response);
    }
}

Connector.prototype.remove_sub = function(req, res, superfeedr_enabled){
    var db = this.db,
        doc = (typeof req.body==="object" ) ? req.body: false;
    if(doc) {
        doc._id = 'sub-'+doc._id.replace('sub-',''); // be sure it's a subscription
        doc._deleted = true;
        if(superfeedr_enabled === true && doc.creates == "xmpp") {
            superfeedr.unsubscribe(doc.url, function(notification) {
                db.remove(doc._id, doc._rev, function(err, docs) {
                    if (err) throw new Error(JSON.stringify(err));
                    return res.json({success:true, doc:doc});
                });   
            });
        } else {
            db.remove(doc._id, doc._rev, function(err, docs) {
                if (err) throw new Error(JSON.stringify(err));
                return res.json({success:true, doc:doc});
            });           
        }
    } else {   
        return res.json({success:false});
    }
}

Connector.prototype.get_subs = function(req, res) {
    var query = {};
    this.db.view('sources/subscriptions', query, function(err, docs) {
        if (err) throw new Error(JSON.stringify(err));
        var max = docs.rows.length
          , subs = [];
        for(var x = 0;max > x;x++) {  
            subs.push(docs.rows[x].value);
        }
        return res.json(subs);                               
    });        
}

exports.Connector = Connector;