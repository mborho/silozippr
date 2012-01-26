/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var ntwitter = require('ntwitter');

function Twitter(conf, db) {
    var _client = new ntwitter(conf);
    var _db = db;
    
    function _replace_entities(text, entities) {
        var urls = entities.urls,
            mentions = entities.user_mentions,
            tags = entities.hashtags,
            len_mentions = mentions.length,
            len_tags = tags.length,
            len_urls = urls.length;
            
        for(var x = 0; len_mentions > x; x++) {
            try {
                text = text.replace(
                    new RegExp('@'+mentions[x].screen_name, "i"),                    
                    '<a href="https://twitter.com/'+mentions[x].screen_name+'">@'+mentions[x].screen_name+'</a>'                    
                );
            } catch(e) {
                console.log(e);
            }
        }
        
        for(var x = 0; len_tags > x; x++) {
            try {
                if(tags[x].text !== undefined) {
                    text = text.replace(
                        new RegExp('#'+tags[x].text, "i"),                    
                        '<a href="https://twitter.com/search?q=%23'+tags[x].text+'">#'+tags[x].text+'</a>'
                    );                                
                }            
            } catch(e) {
                console.log(e);
            }                
        }
        
        for(var x = 0; len_urls > x; x++) {
            try {
                text = text.replace(
                    new RegExp(urls[x].url, "i"),                    
                    '<a href="'+((urls[x].expanded_url !== undefined) ? urls[x].expanded_url: urls[x].url)+'">'+
                    ((urls[x].display_url !== undefined) ? urls[x].display_url: urls[x].url)+'</a>'
                );            
            } catch(e) {
                console.log(e);
            }                
        }
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
        return img+' '+user_link+': '+text;
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
            }            
        }     

        _db.save(doc, function (err, res) {        
            // Handle response
            if(err) {
                console.log(err);
            }
        });        
    }
     
    return {
        userstream: function(user) {
            console.log("twitter stream starting");
            var reCb = this.userstream;
            _client.stream('user', {track:user}, function(stream) {
                stream.on('data', function (data) {
                    if(data.id !== undefined) {
                        _handleStatus(data);
                    }
                });
                stream.on('end', function (response) {
                    // Handle a disconnection
                    console.log("twitter stream ended");
                });
                stream.on('destroy', function (response) {
                    // Handle a 'silent' disconnection from Twitter, no end/error event fired
                    console.log("twitter stream destroyed");
                    reCb(user);
                });
            });   
        }                           
    }
}

exports.Twitter = Twitter;