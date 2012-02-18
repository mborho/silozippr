/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var dateFormat = require('dateformat'),
    sanitize = require('validator').sanitize;

var _BASE_CLASSES = "well";

function sani(str, with_pics) {
    var cleaned = '';
    try {
        cleaned = sanitize(str).xss();
        if(with_pics === true) {
            cleaned = sanitize(cleaned).xss(true);
        }
    } catch(e) {
        console.log('XSS error');
        console.log(e);
        cleaned = '';
    }
    return cleaned;
}

function getDateFormatStr(now, docDate) {
    return ((now-docDate) > 86000000) ? 'dd.mm. HH:MM' : 'HH:MM';
}

function renderItem(doc, combined, last) {    
    var html = '<div class="'+_BASE_CLASSES+' line-item news" id="box-'+doc._id+'" data-doc-id="'+doc._id+'" data-doc-rev="'+doc._rev+'" data-doc-source="'+doc.skey+'">';
    html += '<div class="line-meta">';
    html += '<div class="line-date">'+dateFormat(parseInt(doc.published), doc.date_format)+'</small></div>';                
    html += '<div class="btn-group">';
    html += '<a class="btn dropdown-toggle ignore" data-toggle="dropdown" href="#"><span class="caret"></span></a>';
    html += '<ul class="dropdown-menu">';
    html += '<li><a class="ignore" href="#" onclick="return Controller.tweet(\'box-'+doc._id+'\');">tweet</a></li>';    
    html += '<li class="divider"></li>';    
    html += '<li><a class="ignore" href="#" onclick="return Controller.deleteDoc(\'box-'+doc._id+'\');">clear</a></li>';
    if(last === true) {
        html += '<li><a class="ignore" href="#" onclick="return Controller.deleteInView();">clear all</a></li>';
    }    
    html += '</ul></div>'
    html += '</div>';
    html += '<div class="line-content">'
    if (doc.feed !== undefined && combined) {
        html += '<div class="line-source"><a onclick="Controller.getItemsByFeed(\''+doc.skey+'\', \''+doc.feed.title+'\');return false;">'+doc.feed.title+'</div>';
    }
    html += '<div class="line-title"><a href="'+doc.link+'">'+sani(doc.title)+'</a></div>'
    if (doc.summary !== false && doc.summary !== undefined) {
        html += '<div class="line-body">'+sani(doc.summary, true)+'</div>';
    }
    html += '</div></div>';
    return html;
}   

 function renderTweet(doc, last) {    
    var html = '<div class="'+_BASE_CLASSES+' line-item tweet" id="box-'+doc._id+'" data-doc-id="'+doc._id+'" ';
    html += 'data-doc-rev="'+doc._rev+'" data-doc-source="'+doc.skey+'">';                    
    html += '<div class="line-meta">';
    html += '<div class="line-date"><a onclick="Controller.getItemsByFeed(\''+doc.skey+'\', \''+doc.feed.title+'\');return false;"><img src="/img/twitter.png" /></a>';
    html += '<a class="tweet-link" href="'+doc.link+'">'+dateFormat(parseInt(doc.published), doc.date_format)+'</a> '+((doc.byline != null) ? doc.byline : '')+'</div>';                
    html += '<div class="btn-group">';
    html += '<a class="btn dropdown-toggle ignore" data-toggle="dropdown" href="#"><span class="caret"></span></a>';
    html += '<ul class="dropdown-menu">';
    html += '<li><a class="ignore" href="#" onclick="return Controller.reply(\'box-'+doc._id+'\');">reply</a></li>';
    html += '<li><a class="ignore" href="#" onclick="return Controller.retweet(\'box-'+doc._id+'\');">retweet</a></li>'; 
    html += '<li class="divider"></li>';    
    html += '<li><a class="ignore" href="#" onclick="return Controller.deleteDoc(\'box-'+doc._id+'\');">clear</a></li>';
    if(last === true) {
        html += '<li><a class="ignore" href="#" onclick="return Controller.deleteInView();">clear all</a></li>';
    }
    html += '</ul></div>'    
    html += '</div>';
    html += '<div class="line-content">'
    html += '<div class="line-body">'+sani(doc.summary)+'</div>';
    html += '</div></div>';
    return html;
}   

function renderNext(doc) {
    var html = '<div class="'+_BASE_CLASSES+' line-item-next" id="box-next" data-next-id="'+doc._id+'" data-next-time="'+doc.created_at+'">';                    
    html += '<div class="line-meta">';    
    html += '<div class="line-content">';
    html += 'LOAD NEXT';
    html += '</div></div>';
    return html;        
}

function renderPushed(doc) {
    var html = '',
        now = new Date().getTime();
    doc.date_format = getDateFormatStr(now, doc.published);
    if(doc.type == "tweet") {
        html = renderTweet(doc);
    } else {
        html = renderItem(doc, true);        
    }
    return html;
}

function renderList(docs, combined, limit, append, res) {
    var html = ''
        , max = docs.rows.length
        , max_for = (limit && max > limit) ? max-1 : max
        , items = []
        , now = new Date().getTime();
    for(var x = 0;max_for > x;x++) {    
        docs.rows[x].value.date_format = getDateFormatStr(now, docs.rows[x].value.published);
        items[x] = {skey: docs.rows[x].value.skey, feed: { title: docs.rows[x].value.feed.title }};        
        if(docs.rows[x].value.type== "tweet") {
            html += renderTweet(docs.rows[x].value, (x+1 == max_for));
        } else {
            html += renderItem(docs.rows[x].value, combined, (x+1 == max_for));
        }
    }
    if(max == max_for+1) {
        html += renderNext(docs[max_for].value);
    }
    return res.json({success: true, docs: items, html: html, append: append, total_docs:docs.total_rows});
}

exports.list = renderList
exports.pushed = renderPushed
