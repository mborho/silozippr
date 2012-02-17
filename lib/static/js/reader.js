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

$(document).ready(function() {
    
    $('body.wrapper').show();
    
    $('#header').click(function(e) {
        e.preventDefault();
        if(e.target.nodeName  !== "LI" && $(e.target).parents("li").length == 0) {
            window.location.hash="!"; 
        }
    });
    
    $('#reload').click(function(e) {
        e.preventDefault();
        window.location.reload();
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


