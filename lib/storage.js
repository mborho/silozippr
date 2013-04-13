/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var cradle = require('cradle'),
    fs = require('fs'),
    db = false,
    designDocPath = __dirname+'/files/_design_sources.json',
    util = require('util');

function init(conf, noInitActions) {
    if(db === false) {
        db = new(cradle.Connection)(conf.server, conf.port, {
            auth: { username: conf.user, password: conf.password },
            cache: false
        }).database(conf.name)
    }
    if(noInitActions !== false) {
        setTimeout(compactAndCleanup, 2000);
        setTimeout(migrateDesignDoc, 1000);
    }
    return db;
}

function migrateDesignDoc() {
    if(db !== false) {
        util.log('syncing design doc');
        fs.readFile(designDocPath, function (err, data) {
            var designDoc = JSON.parse(data.toString());
            db.get('_design/sources', function(err, doc) {
                if (err && err.error !== "not_found" ) {
                    util.debug("db wasn't ready, will try in 2 seconds again");
                    setTimeout(migrateDesignDoc, 2000);
                } else {
                    if(!doc || doc.version === undefined || doc.version !== designDoc.version) {
                        db.save('_design/sources', designDoc, function(err, doc) {
                            if (err) throw new Error(JSON.stringify(err)); 
                            util.log('new design document migrated');        
                        });
                    }
                }
            });
        });
    }
}

function compactAndCleanup() {
    if(db !== false) {
        util.log('clean up the views and compact the db');
        db.compact({}, function(err, res) {
            if(err) util.debug('compact failed', res);
            else util.log('compact', res);
        });
        db.viewCleanup(function(err, res) {
            if(err) util.debug('viewCleanup failed', res);
            else util.log('viewCleanup', res);
        });        
    }
    setTimeout(compactAndCleanup, 21600000);
}

exports.getDb = init;
