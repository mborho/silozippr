var util = require('util'),
    events = require('events'),
    PubSubHubBub = require('./pubsubhubbub.js').PubSubHubBub,
    Twitter = require('./twitter').Twitter,
    SuperfeedrClient = require('./superfeedr-client').SuperfeedrClient,
    Poller = require('./poller').Poller,
    JobQueue = require('./queue').JobQueue;
    
function Aggregator(db, nconf) {
    _db =db;
    _nconf = nconf;
    
    
    // libs and services
    if(_nconf.get('twitter:enabled')) {
        var twit = new Twitter(_nconf.get('twitter'), _db);
        twit.stream();
    }

//     var superfeedr = false;
//     if(_nconf.get('superfeedr:enabled')) {
//         superfeedr = new SuperfeedrClient(_db, _nconf.get('superfeedr'));
//         superfeedr.start()
//     }

    var jobQueue = new JobQueue(_db);
    var pubSubHubBub = new PubSubHubBub(_db,_nconf.get('app'));
    var poller = new Poller(_db,_nconf.get('app'));
    poller.on('pubsubFeed', function(sub, feed) {
        util.log('handling pubsubhubbub feed');
        pubSubHubBub.handleSub(sub, feed,function(err, subscribed) {
            if(err) util.debug(err);
            else util.log('poller: subscribed');
        });
    });

    if(_nconf.get('poller:enabled')) {
        jobQueue.start();
        jobQueue.on('queue.poll', function(sub) {
            poller.emit('fetchFeed', sub);
        });
    }

    jobQueue.on('queue.unsubscribe', function(doc) {
        if(doc.pubsub != undefined && doc.pubsub.token != undefined) {
            pubSubHubBub.unsubscribe(doc, function(pushErr, unsubscribed) {
                if(pushErr) util.debug(pushErr);
                _db.remove(doc._id, doc._rev, function(err, docs) {
                    if (err) throw new Error(JSON.stringify(err));
                    else util.log('sub '+doc._id+' removed from db');
                }); 
            });
        } else {
            _db.remove(doc._id, doc._rev, function(err, docs) {
                if (err) throw new Error(JSON.stringify(err));
                else util.log('sub '+doc._id+' removed from db');
            }); 
        }
    }); 
    
    this.on('poller.pushed', poller.fromString);
    this.on('send-tweet', twit.tweet);
    this.on('send-retweet', twit.retweet);
    
    this.pubSubVerify = function(req, res, token) {
        return pubSubHubBub.verify(req, res, token);
    }
    
}

util.inherits(Aggregator, events.EventEmitter);
exports.Aggregator = Aggregator;
