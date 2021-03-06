/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var FeedLoader = require('./feed').FeedLoader,
    util = require('util');
    
var Connector = function(db, renderer) {
    this.db = db;
    this.list_limit = 25;
    this.renderer = renderer
}

Connector.prototype.remove_doc = function(socket, doc) {
    util.log('removing '+doc._id+' rev:'+doc._rev);
    this.db.remove(doc._id, doc._rev, function(err, docs) {
        var res = !res;
        return socket.emit('removeDocResult', {success: res, doc:doc});                        
    });       
}   

Connector.prototype.remove_docs = function(responseHandler, data) {
    var max = data.docs.length,
        bulk= JSON.stringify({'docs':data.docs})
        res = true;    
    util.log('removing '+max+' docs');   
    this.db.save(data.docs, function() {
        if(typeof(responseHandler.json) == "function") {          
            return responseHandler.json({success: true, deleted: data.docs}); 
        } else {
            return responseHandler.emit('removeDocsResult', {success: true, deleted: data.docs, all:data.all});                                 
        } 
    });
}    

Connector.prototype.get_index_docs = function(res, startkey, format) {
    var limit = this.list_limit,
        start = (startkey) ? JSON.parse(startkey) : false,
        renderFunc = (format == "json") ? this.renderer.renderJsonList : this.renderer.renderList,
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
        renderFunc(docs, true, limit, (startkey !== false), res);                     
    });    
}

Connector.prototype.get_source_docs = function(res, skey, startkey, format) { 
    var limit = this.list_limit,
        start = (startkey) ? JSON.parse(startkey) : false,
        renderFunc = (format == "json") ? this.renderer.renderJsonList : this.renderer.renderList,
        query = {            
            descending: true,
            startkey: [skey,((start) ? start[0]: {})],
            endkey: [skey],
            limit: limit + 1,
            startkey_docid: ((start) ? start[1] : '')
        };    
    this.db.view('sources/by_feed_link', query, function(err, docs) {
        if (err) throw new Error(JSON.stringify(err));
        renderFunc(docs, false, limit, (startkey !== false), res);                                      
    });
}

Connector.prototype.clear_source = function(res, skey) { 
    var limit = this.list_limit,
        query = {key: skey},
        db = this.db;
    this.db.view('sources/docids', query, function(err, docs) {
        if (err) throw new Error(JSON.stringify(err));
        var bulk = []
        docs.forEach(function(doc) {
            bulk.push({_id: doc[0], _rev: doc[1], _deleted:true});
        });
        db.save(bulk, function (err, db_res) {         
            return res.json({success: true, skey:skey, sum:bulk.length});                              
        });
    });
}

Connector.prototype.get_toc = function(res, skey) {   
    var query = {
        group: true
    }
    if(skey) {
        query.startkey = [skey,null];
        query.endkey = [skey,{}];
    }
    this.db.view('sources/toc', query, function(err, docs) {        
        if (err) throw new Error(JSON.stringify(err));
        var rows = docs.rows,
            success = !err;       

        function compare(a,b) {
            if (a.value < b.value) return 1;
            if (a.value > b.value) return -1;
            return 0;
        }
        
        if(!skey) rows = rows.sort(compare);
                 
        return res.json({success: success, rows: rows});                      
    });        
}    

Connector.prototype.add_sub = function(req, res) {
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
                util.log(new_url+' '+err)
                res.json({success:false, valid: false}); 
            } else {                
                if(feed.valid === true) {
                    var response = {
                            success:true, 
                            step: parseInt(req.body.step), 
                            valid: feed.valid, 
                            pubsubhub: false,
                            title: feed.title, 
                            handler: handler,
                            saved: false
                        },
                        doc = {
                            type: "subscription", 
                            url: feed.url, 
                            title: feed.title, 
                            skey: feed.skey,
                            creates: 'newsitem', 
                            next_check: new Date().getTime(),
                            links: []
                        };
                    // add push hub    
                    if(feed.pubSubHub) {
                        doc["pubsub"] = {hub: feed.pubSubHub}
                    }
                    util.log('save subscription');           
                    db.save('sub-'+feed.skey, doc, function(couch_err, couch_res) {
                        response.saved = true;
                        res.json(response); 
                    });   
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

Connector.prototype.remove_sub = function(req, res){
    var db = this.db,
        doc = (typeof req.body==="object" ) ? req.body: false;
    if(doc) {
        doc._id = 'sub-'+doc._id.replace('sub-',''); // be sure it's a subscription
        util.log(doc._id+' '+doc.url+' unsubscribed, changing sub.type');
        db.merge(doc._id, {type:"unsubscription"}, function(err, docs) {
            if (err) throw new Error(JSON.stringify(err));
            return res.json({success:true, doc:doc});
        });     
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
