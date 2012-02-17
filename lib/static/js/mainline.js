/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var Mainline = function(data, combined) {
    this.docs = data.docs;    
    this.rendered = data.html;
    this.combined = combined;
    this.count = 0;
    this.pushed = 0;
    this.container = $('#mainline');
    this.container.unbind("click");
    this.container.click(function(e) {
        var target = $(e.target),
            nextBox =  false,
            href = false;
        if(target.is('img')) {                        
            var parent = target.parent();
            if(parent[0] !== undefined) {
                target = $(parent[0]);
            }
        } 
        if(target.is('a') && !target.hasClass('ignore') && !target.attr('onclick')) {          
            href = target.attr('href');
            window.open(href, '', '');         
            return false;
        }
        // handle the next-click
        if(target.is('#box-next')) {
            nextBox = target;
        } else {
            var parentNext = target.parents("#box-next");
            if(parentNext[0] != undefined) {
                nextBox = $(parentNext[0]);
            }            
        } 
        if(nextBox) {
            Controller.getNextItems([parseInt(nextBox.attr('data-next-time')), nextBox.attr('data-next-id')]);
        }
    });
};

Mainline.prototype.clear = function() {
    this.container.html('');
    this.showSpinner();
};

Mainline.prototype.addPushed = function() {
    var div = $('#pushedBox');    
    if(div.length == 0) {
        this.pushed = 0;
        div = $('<div class="well line-item-more" id="pushedBox">');    
        div.click(function(e) {
            var hidden = $('.hidden')
            hidden.removeClass('line-item-more');            
            hidden.addClass('line-item');                        
            hidden.fadeIn();
            hidden.removeClass('hidden');       
            $(this).remove();            
            $('#delete-button').attr('data-active','true');            
        });
        this.container.prepend(div);
    }
    this.pushed++;
    div.html('<h3>+'+this.pushed+' new</h3>');  
    div.glow('#97B5FF',500);
};

Mainline.prototype.addDoc = function(doc, pushed) {    
    var box = $(doc.html);
    if(this.combined !== true) {
        box.find('.line-source').remove();
    }
    this.count++;
    this.container.prepend(box);
    if(pushed === true) {        
        box.addClass('hidden');
        this.addPushed();
    } else {
        box.fadeIn();
    }
};

Mainline.prototype.hideDocs = function(docs) { 
    if(docs.length ==  1) {
        $('#box-'+docs[0]._id).fadeOut(null, function() {
            $(this).remove()
        });
    } else {
        docs.forEach(function(doc) {
            $('#box-'+doc._id).remove();
        });
    }    
};

Mainline.prototype.append = function(data) {
    $('#box-next').remove();    
    this.container.append(data.html);
    this.count = this.count + data.docs.length;
};

Mainline.prototype.render = function() {    
    var max = this.docs.length,
        box = false;        
    this.hideSpinner();   
    if(this.rendered != undefined) {
        this.count = this.count + max;        
        this.container.html(this.rendered);        
    } 
};  

Mainline.prototype.showSpinner = function() {
    this.container.html('<div class="grid-10 line-item well spinning" id="main-spinner">&#160;</div>');
};

Mainline.prototype.hideSpinner = function() {
    $('#main-spinner').remove();  
};   

Mainline.prototype.showNextSpinner = function() {
    $('#box-next').html('').addClass('spinning');
    
};

define('mainline', [], function() {
        return Mainline;    
});    
