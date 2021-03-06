/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var FeedMe = require('feedme'),
    parser = new FeedMe(),
    request = require('request'),
    util = require('util'),
    md5 = require('blueimp-md5').md5;


var Feed = function(url, data, conditionals) {
    this.valid = false;
    this.conditionals = conditionals;
    this.skey = md5(url);
    this.url   = url;
    this.title = '';
    this.subtitle = '';
    this.link  = '';    
    this.pubSubHub = false;
    this.entries = [];    
    this.setData(data);        
}

Feed.prototype.setData =function(data) {
    this.setTitle(data);
    this.setSubTitle(data);
    this.setLinks(data);
    this.setEntries(data);
    this.valid = true;
}

Feed.prototype.setTitle = function(data) {
    var title = '#';
    if(data.title !== undefined && data.title.text !== undefined) {
        title = data.title.text;
    } else if(typeof(data.title) === "string") {
        title = data.title;
    }
    this.title = this.trim(title);
}

Feed.prototype.setSubTitle = function(data) {
    var subtitle = '';
    if(data.subtitle !== undefined) {
        if(data.subtitle instanceof Object && data.subtitle.text !== undefined) {
            subtitle = data.subtitle.text;
        } else if(typeof(data.subtitle) === "string") {
            subtitle = data.subtitle;        
        }
    } else if(data.description !== undefined) {
        if(data.description instanceof Object === true) {
//             util.log(data)
        } else if(typeof(data.description) === "string") {
            subtitle = data.description;
        }
    }
    this.subtitle = this.trim(subtitle);
}

Feed.prototype.setLinks = function(data) {
    var link = '',
        pubsub = false,
        links = [];

    if(typeof(data.link) === "string") {
        link = data.link;    
    } else {
        // fill links arr for further checks
        links =  (!(data.link instanceof Array)) ? [data.link] : data.link;
    }
    
    if(data['atom10:link'] !== undefined) {
        // add to links arr for further checks
        links = links.concat(data['atom10:link']);
    }
    
    if(data['atom:link'] !== undefined) {
        // add to links arr for further checks
        links = links.concat(data['atom:link']);
    } 
    
    links.forEach(function(rel) {     
        if(rel !== undefined && rel.rel !== undefined) {            
            if(rel.rel === 'hub') {
                pubsub = rel.href;
            } else if(rel.rel === 'alternate' && (rel.type == undefined || rel.type == 'text/html')) {
                link = rel.href; 
            }
        }     
    });
    
    this.link = this.trim(link);
    if(pubsub) this.pubSubHub = this.trim(pubsub);
}

Feed.prototype.setEntries = function(data) {
    var max = data.items.length, 
        entries = [];
    for(var x=0; max > x;x++) {
        var entry = {};
        entry.title = this.getItemTitle(data.items[x]);
        entry.summary = this.getItemSummary(data.items[x]);        
        entry.link = this.getItemLink(data.items[x]);
        entry.published = this.getItemPublished(data.items[x]);
        entries.push(entry);    
    }
    this.entries = entries;
}

Feed.prototype.getItemTitle = function(item) {
    var result = '';
    if(typeof(item.title) == 'string') {
        result = item.title;
    } else if(typeof(item.title.text) == 'string') {
        result = item.title.text;
    }
    return result;
}   

Feed.prototype.getItemLink = function(item) {
    var result = '',
        links = [];
    if(typeof(item.link) == 'string') {
        result = item.link;
    } else if(typeof(item.link) == 'object') {
        var links =  (!(item.link instanceof Array)) ? [item.link] : item.link;        
        for(var y=0; links.length > y;y++) {
            if(links[y].rel == "alternate") {
                result = links[y].href;
                break;
            }
        }   
    }    
    return result;
}   

Feed.prototype.getItemSummary = function(item) {
    var result = '';
    if(typeof(item['content:encoded']) == 'string') {
        result = item['content:encoded'];
    } else if(typeof(item.description) == 'string') {
        result = item.description;
    } else if(item.content !== undefined) {
        if(typeof(item.content) == 'object' && item.content.text !== undefined) {
            result = item.content.text;
        } else if(typeof(item.content) == 'string') {
            result = item.content;            
        }
    } else if(item.summary !== undefined) {
        if(typeof(item.summary) == 'string') {
            result = item.summary;
        } else {
            var summaries = (!(item.summary instanceof Array)) ? [item.summary] : item.summary;
            for(var j=0; summaries.length > j;j++) {
                if(summaries[j].type == "html") {
                    result = summaries[j].text;
                    break;
                }
            }   
        }
    }    
    return result;
}   

Feed.prototype.getItemPublished = function(item) {
    var result = '';
    if(typeof(item.published) == 'string') {
        result = new Date(item.published).getTime()
    } else if(typeof(item.pubdate) == 'string') {
        result = new Date(item.pubdate).getTime()            
    } else {
        result = new Date().getTime() 
    }    
    return result;
}   

Feed.prototype.trim = function(str) {
    try {
        return str.replace(/^(\s*)((\S+\s*?)*)(\s*)$/,"$2")
    } catch(e) {
        util.debug(e);
        util.debug(str);        
    }
    return '';
} 

var FeedLoader = function(options, cb ) {
        
    this.conditionals = {};
    this.cb = cb;
    
    if(typeof(options) == "string") {
        this.url = options;                    
    } else if(typeof(options) == "object") {
        this.url = options.url;            
        if (options.conditionals !== undefined)
            this.conditionals = options.conditionals;
    }       

}

FeedLoader.prototype.load = function() {
    
    var cb = this.cb;            
    request({uri:this.url, encoding:'binary', headers: this.conditionals}, function (error, response, body) {
        try {
            var res =  false,
                headers = {
                    "If-None-Match": (response.headers["etag"] !== undefined) ? response.headers["etag"] : false,
                    "If-Modified-Since": (response.headers["last-modified"] !== undefined) 
                                        ? response.headers["last-modified"] : false,
                },  
                parser = new FeedMe(true);
            if (!error){                
                if(response.statusCode == 200) {
                    body = body.replace(/(\r\n|\n|\r)/gm,"");                
                    if(body.search(/encoding=['"]utf-8['"]/i) > -1) {
                        var buffer = new Buffer(body, 'binary');
                        body = buffer.toString()
                    }
                    parser.write(body);                                        
                    res = new Feed(response.request.uri.href, parser.done(), headers);
                    return cb(null, res);
                } else if(response.statusCode ==304){
//                     util.log('304  not modified');
                    return cb(null, null);
                }                
            } else {
                return cb(error);
            }
        } catch(e) {
            return cb(e);
        }
    });                
}    

var FeedPushed = function(sub, xml, cb ) {
        
    this.xml = xml;
    this.sub = sub;
    this.cb = cb;

}

FeedPushed.prototype.process = function() {    
    var cb = this.cb;
    util.log('processing pushed feed');
    try {
        parser = new FeedMe(true);
        parser.write(this.xml);                                        
        res = new Feed(this.sub.url, parser.done(), this.sub.conditionals);
        return cb(null, res);
    } catch(e) {
        return cb(e);
    }        
}

var FeedString = function(xml, cb ) {
        
    this.xml = xml;
    this.cb = cb;

}

FeedString.prototype.parse = function() {    
    var cb = this.cb;
    util.log('processing pushed string');
    try {
        parser = new FeedMe(true);
        parser.write(this.xml);                                        
        res = new Feed("", parser.done(), {});
        return cb(null, res);
    } catch(e) {
        return cb(e);
    }        
}

exports.FeedLoader = FeedLoader
exports.FeedPushed = FeedPushed
exports.FeedString = FeedString
