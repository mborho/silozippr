/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var ntwitter = require('ntwitter')
    util = require('util');

function Twitter(conf, db) {
    var _client = new ntwitter(conf);
    var _stream = false;
    var _db = db;
    var _user = conf.user;
    
    function _connectionWatchdog() {
        if(!_stream) {
            util.log('twitter user stream ended or was destroyed. try reconnecting');
            _streamUser();
            return;
        }        
        setTimeout(_connectionWatchdog, 45000);
    };
    
    function _replace_entities(text, entities) {
        var urls = entities.urls,
            mentions = entities.user_mentions,
            tags = entities.hashtags,
            medias = (entities.media !== undefined) ? entities.media : [],
            extraMediaUrl = false;            
        
        mentions.forEach(function(mention) {
            try {
                text = text.replace(
                    new RegExp('@'+mention.screen_name, "i"),                    
                    '<a href="https://twitter.com/'+mention.screen_name+'">@'+mention.screen_name+'</a>'                    
                );
            } catch(e) {
                util.debug(e);
            }            
        });
        
        tags.forEach(function(tag) {
            try {
                if(tag.text !== undefined) {
                    text = text.replace(
                        new RegExp('#'+tag.text, "i"),                    
                        '<a href="https://twitter.com/search?q=%23'+tag.text+'">#'+tag.text+'</a>'
                    );                                
                }            
            } catch(e) {
                util.debug(e);
            }
        });
        
        urls.forEach(function(url) {
            try {
                text = text.replace(
                    new RegExp(url.url, "i"),                    
                    '<a href="'+((url.expanded_url !== undefined) ? url.expanded_url: url.url)+'">'+
                    ((url.display_url !== undefined) ? url.display_url: url.url)+'</a>'
                );            
                if(url.expanded_url !== undefined) {
                    if(url.expanded_url.match(/http:\/\/twitpic.com/)) {
                        var extraMediaUrl = 'http://twitpic.com/show/large/'+url.expanded_url.replace(/http:\/\/twitpic.com/,'')
                        util.log('Mediaurl:' + extraMediaUrl);
                        text += '<div class="tweet-media"><img src="'+extraMediaUrl+'" style="width:90%;height:auto;" /></div>';
                    } else if(url.expanded_url.match(/http:\/\/youtu.be/)) {
                        var extraMediaUrl = 'http://www.youtube.com/embed/'+url.expanded_url.replace(/http:\/\/youtu.be/,'')
                        text += '<div class="tweet-media">';
                        text += '<iframe width="420" height="315" src="'+extraMediaUrl+'" frameborder="0" allowfullscreen></iframe>';
                        text += '</div>';
                    }
                }
            } catch(e) {
                util.debug(e);
            }                
        });
        
        medias.forEach(function(media) {
            try {
                if(media.type === "photo") {                
                    text = text.replace(
                        new RegExp(media.url, "i"),
                        '<a href="'+media.expanded_url+'">'+media.display_url+'</a>'
                    );                
                    text += '<div class="tweet-media"><img src="'+media.media_url+'" style="width:'+media.sizes.small.w+'px;height:'+media.sizes.small.h+'px" /></div>';
                }
            } catch(e) {
                util.debug(e);
            }
        });        
        return text;
    }

    function _get_user_link(user) {
        return '<a href="https://twitter.com/'+user.screen_name+'">'+user.screen_name+'</a>';
    }

    function _get_user_img(user) {
        return '<a href="https://twitter.com/'+user.screen_name+'"><img src="'+user.profile_image_url+'"/></a>';
    }
        
    function _build_summary(status) {
        var img = _get_user_img(status.user),
            user_link = _get_user_link(status.user),
            text = _replace_entities(status.text,status.entities);
        return img+' '+user_link+': <span class="twext">'+text+'</span>';
    }            
    
    function _handleStatus(s) {        
        var status = s,
            byline = null,
            doc = false,
            tstamp = false;

        if(status.retweeted_status !== undefined) {
            status = s.retweeted_status;
            byline = 'retweeted by <a href="https://twitter.com/'+s.user.screen_name+'">@'+s.user.screen_name+'</a>';
        }   
        tstamp = new Date(status.created_at).getTime();
        doc = {
            skey: '9a3dc72604878894e69a1746da78eb3c',
            type: 'tweet',
            feed_url: 'http://api.twitter.com/',
            created_at: new Date().getTime(), //tstamp,
            //'id':'twitterstream-%d' % status.id,
            title: status.user.screen_name+': '+status.text,
            link: 'https://twitter.com/'+status.user.screen_name+'/status/'+status.id_str,
            href: 'https://twitter.com/'+status.user.screen_name+'/status/'+status.id_str,
            summary: _build_summary(status),//summary,
            byline: byline,
            published: tstamp,
            feed: {
                title:'Twitter',
                link: 'http://twitter.com',
                desc: 'twitter timeline'
            },
            custom: {
                id: status.id_str,
                screen_name: status.user.screen_name
            }
        }     

        _db.save(doc, function (err, res) {        
            // Handle response
            if(err) {
                util.debug(err);
            }
        });        
    }
    
    function _streamUser() {                
        _client.stream('user', {track:_user}, function(stream) {            
            util.log("twitter userstream established");
            _stream = stream;
            _connectionWatchdog();
            stream.on('data', function (data) {
                if(data.id !== undefined) {
                    _handleStatus(data);
                }
            });
            stream.on('end', function (response) {
                // Handle a disconnection
                util.log("twitter userstream ended");
                _stream = false;
            });
            stream.on('destroy', function (response) {
                // Handle a 'silent' disconnection from Twitter, no end/error event fired
                util.log("twitter userstream destroyed");
                _stream = false;
            });          
        });
    }
    
    return {
        stream: function() {
            _streamUser();
        },
        tweet: function(res, text) {
            _client.updateStatus(text, function(err, data) {
                if(err) util.debug(err);
                util.log('tweeted');
                return res.json({success: !err});
            });     
        },        
        retweet: function(res, id) {
            _client.retweetStatus(id, function(err, data) {
                if(err) util.debug(err);
                util.log('retweeted '+id);                
                return res.json({success: !err});
            });     
        }
    }
}

exports.Twitter = Twitter;