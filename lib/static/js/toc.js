/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var Toc = function() {
    var _toc_elem = '#toc-list';
    var _rows = [];
    var _sums = {};
    
    function _set(rows) {
        _clear();
        _rows = rows;
    };
    function _clear() {
        $(_toc_elem).html('');
    };
    function _loaded(data) {
        _set(data.rows);
        _renderToc();
    };        
    function _setNewSum(source, diff) {
        var li = $('li:[data-source="'+source+'"]'),
            sumDiv = li.children('.toc-sum'),
            sum = parseInt(sumDiv.text());
        var newSum = (diff < 0) ? sum-(-diff) : sum + diff;            
        if(newSum > 0) {                
            sumDiv.text(newSum);
            if(!diff) li.glow('#97B5FF',500);
        } else {
            li.remove();
        }
    };
    function _renderItem(source, title, sum) {   
        var li = $('<li data-source="'+source+'" data-title="'+title+'">');
        li.click(function() {
            Controller.getItemsByFeed(this.getAttribute('data-source'), this.getAttribute('data-title'))
        });   
        var inner = '<div class="toc-title">'+title+'</div>';
        inner += '<div class="toc-sum">'+sum+'</div>';
        li.html(inner);
        return li;
    };
    function _renderToc() {
        var toclist = $(_toc_elem),
        max = _rows.length;     
        for(var x=0;max > x;x++) {
            var li = _renderItem(_rows[x].key[0], _rows[x].key[1], _rows[x].value);        
            _sums[_rows[x].key[0]] = _rows[x].value;
            toclist.append(li);
        }        
    };
    function _addNewItem(source, title, sum) {
            var toclist = $(_toc_elem),
                li = _renderItem(source, title, sum);
            toclist.append(li);
            li.glow('#97B5FF',500);
    };    
    return {
        getNext: function() {
            var toclist = $(_toc_elem+' li')
                nextSource = false;
            if(toclist.length > 0) {
                nextSource = {
                    source:toclist[0].getAttribute('data-source'),
                    title:toclist[0].getAttribute('data-title')
                };    
            }
            return nextSource;            
        },
        docRemoved: function(source, diff) {
            _sums[source] = _sums[source]-diff;
            _setNewSum(source, (diff*-1));
        },
        docAdded: function(doc) {
            var li = $('li:[data-source="'+doc.skey+'"]');
            if(li.length < 1) {
                _sums[doc.skey] = 1;
                _addNewItem(doc.skey, doc.feed.title, 1);                
            } else {
                 _sums[doc.skey]++;
                _setNewSum(doc.skey,1);
            }
        },        
        load: function() {
            $.ajax({
                type: "GET",
                url: "/api/toc/get",
                success: function(data) {
                    _loaded(data);                
                }
            });            
            return false;
        },    
        getSourceCount: function(skey) {
            return (_sums[skey] !== undefined) ? _sums[skey] : 0;
        },
        setSourceCount: function(skey, count) {            
            var diff = (count - _sums[skey]);
            if(diff !== 0) {
                _setNewSum(skey, diff)
            }  
            return diff;
        }
   }
}();

define('toc', [], function() {
    return Toc;    
});  