/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var follow = require('follow');

var Changes = function(db, pipe, cbRender) {
    
    var _db = db;
    var _pipe = pipe;
    var _cbRender = cbRender
    var _lastSeq = false;
    var _feed = false;

    function _start(lastSeq) {        
        if(lastSeq) {
            _lastSeq = lastSeq;
        }
        var auth = '',
            options = {include_docs:true, since:_lastSeq };
            
        console.log("Changes stream starting");  
        
        if (_db.connection.auth && _db.connection.auth.username 
                  && _db.connection.auth.password) {
            auth = _db.connection.auth.username+':'+_db.connection.auth.password + '@';
        }
        options.db = 'http://'+auth+_db.connection.host+':'+_db.connection.port+'/'+_db.name;
        
        follow(options, function(error, change) {
            if(error) {
                console.log("couchdb _changes");
                console.log(error);
            }
            _lastSeq = change.seq;
            if(change.deleted == undefined 
                && (change.doc.type == "newsitem" 
                        || change.doc.type == "tweet"
                                || change.doc.type == "xmpp")) {
                _pushDoc(change.doc);
            } /*else {
//                     pipe.emit('syncDeleted', { doc: change.doc });
//                 }*/                        
        })    
    }
    
    function _pushDoc(doc) {     
        var processed = {skey: doc.skey, html: '', feed: { title: doc.feed.title }};
        processed.html = _cbRender(doc);
        _pipe.emit('news', { doc: processed });
    }   
    
    return {
        init: function() {
            _db.info(function(err, info) {
                if (err) {
                    console.log("error on stream reconnect");        
                    console.log(JSON.stringify(err));        
                    throw new Error(JSON.stringify(err));    
                }
                console.log("db info fetched");        
                _start(info.update_seq);      
            });
        },
        start: function() {
            _start();
        }
    }    
}   

exports.Changes = Changes;