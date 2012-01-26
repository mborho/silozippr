/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
function responseHandler(res) {
    var radios = false;
    if(res.success === true && res.valid) {
        if(res.step == 1 && res.saved === false) {
            radios = '<label for="form_realtime">Subscribe feed with:</label> \
                    <input type="radio" name="handler" value="superfeedr" checked="checked"/>Superfeedr'+
                    ((res.pubsubhub !== false) ? ' <i>(Feed is realtime enabled!)</i>' : '')+'<br/> \
                    <input type="radio" name="handler" value="polling">No, traditional polling ';
            $('#source-form #form #form-rt').html(radios);
            $('#source-form #form #form-step').attr('value', 2);       
        } else if(res.saved === true) {
            $('#source-form #form').html('');
            $('#source-form .form-err').html('');
            $('#source-form .form-msg').html('<b>Feed subscribed</b>');
        }
    } else if(!res.success && res.valid !== true) {
        $('#source-form .form-err').html('No valid feed found!');
    }
    return false;
}    

function submitHandler() {
    $.ajax({
        type: 'POST',
        url: "/api/subs/add" ,
        data: $('#'+this.id).serialize(),
        success: responseHandler
    });
    return false;
}    

var FeedForm = function(skey) {
    this.skey = skey;        
}
 
FeedForm.prototype.getFeedForm = function() {
    var form = $('<form id="feed-form" method="POST">'),    
        html = '<div class="field required"> \
                            <label for="form_feed_url">Feed url</label> \
                            <input type="text" id="form_feed_url" name="feed_url"> \
                </div> \
                <div class="field" id="form-rt"> \
                </div> \
                <div class="field submit"><input type="hidden" id="form-step" name="step" value="1" /><input type="submit" value="go"/></div>';
    form.html(html)          
    form.submit(submitHandler);    
    return form;
}    

    
FeedForm.prototype.showForm = function() {
    $('#source-form #form').html(FeedForm.prototype.getFeedForm());
    return true;
}    

var SubsForm = function() {

    function _clear() {
        $('#source-form .form-msg').html('');
        $('#source-form .form-err').html('');
        $('#source-form #form').html('');
    };
    function _showSpinner(){
            $('#sources-list').addClass('spinning');
    };
    function _hideSpinner() {
            $('#sources-list').removeClass('spinning');
    };
    return {        
        showForm: function() {
            var handler = this.fillForm;
            _clear();
            _showSpinner();
            $.ajax({
                type: 'GET',
                url: "/api/subs/list",
                success: function(subs) {
                    _hideSpinner();
                    handler(subs);
                }
            });
            return false;
        },
        fillForm: function(subs) {
            var ul = $('#subs-list'),
                max = subs.length,
                removeHandler = function(doc) {
                    $.ajax({
                        type: 'POST',
                        url: "/api/subs/remove",
                        data: doc,
                        success: function(res) {
                            if(res.success) {  
                                var li = $('li:[data-id="'+res.doc._id+'"]')
                                li.remove();
                            } else alert('error');
                        }
                    });
                }
            ul.html('');
            for(var x=0; max > x; x++) {
                var li = $('<li data-id="'+subs[x]._id+'">');
                var next_fetch = (subs[x].creates == 'newsitem' && subs[x].next_check !== undefined) ? (subs[x].next_check - new Date().getTime()) : false;
                var action = $('<a class="subs-del" data-id="'+subs[x]._id+'" data-rev="'+subs[x]._rev+'" data-url="'+subs[x].url+'" data-creates="'+subs[x].creates+'">&#160;</a>');
                action.click(function(e) {
                    var dataObj = false;
                    if(confirm('unsubscribe?')) {
                        dataObj = $(e.currentTarget);
                        removeHandler({
                            _id:dataObj.attr('data-id'), 
                            _rev:dataObj.attr('data-rev'),
                            url: dataObj.attr('data-url'),
                            creates: dataObj.attr('data-creates')
                        });
                    }
                });
                li.html(action);                
                li.append('<div>'+subs[x].title +' <span class="sub-prop"> /'+((subs[x].creates === 'xmpp') ? 'superfeedr': '')+ ((next_fetch) ? ' check in '+Math.round(next_fetch/1000/60)+' mins' : '')+'</span></div>');
                ul.append(li);
            }
            return;
        } 
    }
}

define('forms', [], function() {
    return {feed: FeedForm, subs: SubsForm};    
});  