/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
require(["controller"], function(controller) {
    Controller = controller;
    Controller.getIndexItems(true);
});

socket.on('error', function (reason){
    console.error('Unable to connect Socket.IO', reason);
});

socket.on('connect', function (){
    console.info('successfully established a working connection \o/');
});

socket.on('disconnect', function () {
    console.info('connection disconnect');
});

socket.on('news', function (data) {
    Controller.addItem(data.doc, true);
});

socket.on('removeDocsResult', function (data) {
    if(data.success !== true) {    
        alert("deleting failed");
    }   
    if(data.all === true)  { 
        Controller.checkNext();
    } else {
        Controller.hideDocs(data.deleted);
    }
});

socket.on('removeDocResult', function (data) {
    if(data.success == true) {
        Controller.hideDocs([data.doc]);
    } else {
        alert("deleting failed");
    }
});   

$(document).ready(function() {
    
    $('body.wrapper').show();
    
    $('#header').click(function(e) {
        e.preventDefault();
        window.location.hash="top"; 
    });
    
    $('#reload').click(function(e) {
        e.preventDefault();
        window.location.reload();
    });            

    $('#mainline .line-body a').click(function(e) {
        e.preventDefault();
        console.log('bla');
    });      
        
    $('#expand').click(function(e) {
        e.preventDefault();
        if($('#mainline .news .line-body:not(:hidden)').length > 0) {
            $('.news .line-body').fadeOut();                                   
        } else {          
            $('.news .line-body').fadeIn(); 
        }            
        return false;
    });
    
    $('.line-title a').click(function(e) {
        e.preventDefault();            
        window.open(e.currentTarget.href);
    });
    
    $('#toc-more').click(function(e) {
        e.preventDefault(); 
        $('#toc-box').toggle();
    });

}); 

function elementInViewport(el) {
  var top = el.offsetTop;
  var height = el.offsetHeight;

  while(el.offsetParent) {
    el = el.offsetParent;
    top += el.offsetTop;
  }

  return (
    top >= window.pageYOffset &&
    (top + height) <= (window.pageYOffset + window.innerHeight)
  );
}

function checkVisible() {
    var el = $('#content:visible #box-next:not(.clicked)')[0];
    if(el !== undefined && elementInViewport(el)) {   
        $(el).addClass('clicked').click();
    }
}    
    
window.setInterval("checkVisible()", 500);    


