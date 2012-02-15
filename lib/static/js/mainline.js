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
};

Mainline.prototype.clear = function() {
    this.container.html('');
    this.showSpinner();
};

Mainline.prototype.prepend = function(div, addClickEvent) {
    if(addClickEvent) {
        this.addClickHandler(div);
    }
    this.container.prepend(div);
};

Mainline.prototype.addHandler = function(elem) {
    this.addClickHandler(elem);
    this.addNextHandler(elem);
};

Mainline.prototype.addClickHandler = function(elem) {
    // click handler for items
    var links = elem.find('a:not(.ignore)');
    links.unbind("click");
    links.click(function(e) {
        e.preventDefault();
        console.log(e.currentTarget.href);
        window.open(e.currentTarget.href, '', ''); 
        return false;
    });
};

Mainline.prototype.addNextHandler = function(elem) {    
    // click handler for next box
    var box_next = elem.find('#box-next');
    box_next.click(function(e) {
        Controller.getNextItems([parseInt(box_next.attr('data-next-time')), box_next.attr('data-next-id')]);
    });
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
    this.prepend(box, true);            
    if(pushed === true) {        
        box.addClass('hidden');
        this.addPushed();
    } else {
        box.fadeIn();
    }
};

Mainline.prototype.hideDocs = function(docs) {
    var max = docs.length;
    for(var x = 0; max > x; x++) {
        var del = $('#box-'+docs[x]._id);
        //var source = docs[x].source;
        del.fadeOut(null, function() {
            $(this).remove()
        });
    }
};

Mainline.prototype.append = function(data) {
    $('#box-next').remove();    
    this.container.append(data.html);
    this.addHandler(this.container); 
    this.count = this.count + data.docs.length;
};

Mainline.prototype.render = function() {    
    var max = this.docs.length,
        box = false;        
    this.hideSpinner();   
    if(this.rendered != undefined) {
        this.count = this.count + max;        
        this.container.html(this.rendered);
        this.addHandler(this.container);        
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
