/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */

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
        var query = {
                include_docs:true,
                since:_lastSeq
        } 
        console.log("Changes stream starting");  
        
        _feed = _db.changes(query);            
        
        _feed.on("change", function (change) {
            _lastSeq = change.seq;
            if(change.deleted == undefined 
                && (change.doc.type == "newsitem" 
                        || change.doc.type == "tweet"
                                || change.doc.type == "xmpp")) {
                _pushDoc(change.doc);
            } /*else {
                    pipe.emit('syncDeleted', { doc: change.doc });
                }*/                        
        });
        
        _feed.on('retry', function(info) {
            console.info('Follow retry');
            _feed.stop()
            setTimeout(_start, 30000);
            console.log(info);
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