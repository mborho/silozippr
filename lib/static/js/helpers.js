/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var Helpers = function() {

    return {
        truncate: function (text, len, show_more) {  
            var len = (len > 0) ? len : 100;    
            var show_more = (show_more !== undefined) ? show_more : false;   
            var textElem = $('<div>');    
            textElem.html(text);    
            if(textElem.text().length < 2) {
                return false
            }    
            console.log(show_more);
            var trunc = text;    
            if (text.length > len) {
                
                /* Truncate the content of the elem, then go back to the end of the
                previous word to ensure that we don't truncate in the middle of
                a word */
                text = text.substring(0, len);
                text = text.replace(/\w+$/, '');
        
                /* Add an ellipses to the end and make it a link that expands
                the paragraph back to its original size */
                text += ' <a href="#" ' +
                'onclick="this.parentNode.innerHTML=' +
                'unescape(\''+escape(textElem.html())+'\');return false;" class="more-link-1">' + show_more + '<\/a>';
                textElem.html(text);
            }        
            return textElem.html();
        }
    }
}();


define('helpers', [], function() {
    return Helpers;    
});  