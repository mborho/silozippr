/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var cradle = require('cradle'),
    db = false,
    designDocPath = __dirname+'/files/_design_sources.json';    

function init(conf) {
    if(db === false) {
        db = new(cradle.Connection)(conf.server, conf.port, {
            auth: { username: conf.user, password: conf.password }                    
        }).database(conf.name)
    }
    setTimeout(compactAndCleanup, 2000);
    setTimeout(migrateDesignDoc, 1000);
    return db;
}

function migrateDesignDoc() {
    if(db !== false) {
        console.log('syncing design doc');
        fs.readFile(designDocPath, function (err, data) {
            if (err) throw err;
            var designDoc = JSON.parse(data.toString());
            db.get('_design/sources', function(err, doc) {
                if (err && err.error !== "not_found" ) throw new Error(JSON.stringify(err));                
                if(!doc || doc.version === undefined || doc.version !== designDoc.version) {
                    db.save('_design/sources', designDoc, function(err, doc) {
                        if (err) throw new Error(JSON.stringify(err)); 
                        console.log('new design document migrated');        
                    });
                }
            });
        });
    }
}

function compactAndCleanup() {
    if(db !== false) {
        console.log('clean the views up and compact the db');
        db.compact()
        db.viewCleanup()        
    }
    setTimeout(compactAndCleanup, 21600000);
}

exports.getDb = init;