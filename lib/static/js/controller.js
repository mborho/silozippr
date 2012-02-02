/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var Controller = (function(socket, toc) {
    var _socket = socket;
    var _toc = toc;
    var _mainline = false;
    var _mainlineId = 'mainline';
    var _feedView = false;
    var _feedViewName = 'Home';
    var _total_docs = 0;
    var _total_view_docs = 0;
    var _settings = false;

    function _clearView() {        
        _setTotalViewDocs(0);
        _mainline.clear();
    };
    function _setViewName(name, feed_view) {
        _clearView();            
        var view_name = (name != '') ? name : '';
        $('#view-name').text(view_name);  
    };
    function _setTotalDocs(sum) {
        $('#total-docs').text(sum);  
        if(_feedView === false) {
            $('title').text(sum);
        }
        _total_docs = (sum < 0) ? 0 : sum;        
    };          
    function _setTotalViewDocs(sum) {
        $('#total-view-docs').text(sum);  
        if(_feedView) {
            $('title').text(sum+' - '+_feedViewName);
        }
        _total_view_docs = (sum < 0) ? 0 : sum;
        if(_total_view_docs == 0) _hideViewElements();
    };
    function _decreaseTotalDocs(minus) {
        var current = parseInt($('#total-docs').text());
        _setTotalDocs((current-minus));
    };
    function _increaseTotalDocs(plus) {
        var current = parseInt($('#total-docs').text());
        _setTotalDocs((current+plus));
    };
    function _decreaseTotalViewDocs(minus) {
        var current = parseInt($('#total-view-docs').text());
        _setTotalViewDocs((current-minus));
    };
    function _increaseTotalViewDocs(plus) {
        var current = parseInt($('#total-view-docs').text());
        _setTotalViewDocs((current+plus));
    };
    function _hideViewElements() {
        $('#view-name-box').hide();
        $('#total-view-docs').hide();
        $('#delete-button').attr('data-token', '');        
    };
    function _showViewElements() {
        $('#view-name-box #source-del').attr('data-source', _feedView);
        $('#view-name-box').show();
        $('#total-view-docs').show();
        window.setTimeout(function() {
            $('#delete-button').attr('data-token', _feedView);        
        }, 1000);
    };
    function _showToolBox() {
        $('#tool-box').show();
        $('.tool-box-actions').show();
    };
    function _hideToolBox() {
        $('#tool-box').hide();
    };    
    function _deleteDocs(docs) {
        var length = docs.docs.length
        _socket.emit('removeDocs', docs );
        _decreaseTotalViewDocs(length);
        _decreaseTotalDocs(length);            
    };    
    function _gotItemsByFeed(data, mainView) { 
        if(data.append) {
            _mainline.append(data);
        } else {
            _mainline = new Mainline(data, mainView);
            _mainline.render();
        }
        
        if(_mainline.count > 0) _showToolBox();             
        else _hideToolBox();
    
        if(mainView === true) {
            _setTotalDocs(data.total_docs);
        } else {
            _showViewElements();
        };
        $('#expand').show();
    };
    function _deleteItemsInView(sum) {
        var all = ((sum == undefined) ? true : false),
            boxes = $('#'+_mainlineId+' .line-item:visible'+((!all && sum) ? ':lt('+sum+')':'')),
            max = boxes.length,
            docs = [],
            source = false,
            nextSource;                          
        for(var x = 0;max > x;x++) {
            source = boxes[x].getAttribute('data-doc-source');
            docs.push({
                    _id:boxes[x].getAttribute('data-doc-id'),
                    _rev:boxes[x].getAttribute('data-doc-rev'),
                    source:source,
                    _deleted: true
                })                
            _toc.docRemoved(source,1);
        }         
        if(_feedView && (_toc.getSourceCount(_feedView)+max !== max)) {
            all = false;
        }
        _deleteDocs({docs:docs, all: all});
        if(all) {
            _clearView();
        }
    };
    return {          
        checkNext: function () {
            var nextSource = _toc.getNext();
            if(nextSource) {
                this.getItemsByFeed(nextSource.source, nextSource.title)
            } else {
                this.getIndexItems();
            }
        },
        hideDocs: function(docs) {
            var nextSource = false;
            _mainline.hideDocs(docs);
            if(_feedView !== false && _total_view_docs == 0) { 
                this.checkNext();
            } else if(_feedView === false && _total_docs == 0) {
                $('.tool-box-actions').hide();
            }            
        },
        addItem: function(doc, pushed) {
            if(_feedView === false || _feedView === doc.skey) {                                
                _mainline.addDoc(doc, pushed);                                
                _showToolBox();
            }    
            if(pushed === true) {
                _increaseTotalDocs(1);
                if(_feedView === doc.skey) {
                    _increaseTotalViewDocs(1);
                }
                _toc.docAdded(doc);
            }
        },
        deleteInView: function(sum) {
            if(_feedView == false
                    || _feedView === $('#delete-button').attr('data-token')) {                
                        _deleteItemsInView(sum);
            }
        },
        deleteDoc: function(box_id) {
            var box = $('#'+box_id),
                doc_id = box.attr('data-doc-id'),
                rev_id = box.attr('data-doc-rev'),
                source = box.attr('data-doc-source'),
                decrHeight = (window.innerWidth > 720)? 10 : 5;   
            box.html('<div class="spinning" style="height:'+(box.height()-decrHeight)+'px"></div>');
            _socket.emit('removeDoc', {_id:doc_id, _rev:rev_id, source: source} );
            _decreaseTotalViewDocs(1);
            _decreaseTotalDocs(1);
            _toc.docRemoved(source,1);
        },
        getItemsByFeed: function(skey, feed_title, start_key) {            
            var query = "id="+encodeURIComponent(skey);
            if(start_key !== undefined) {
                query += '&startkey='+encodeURIComponent(JSON.stringify(start_key));
            } else {
                $.ajax({
                    type: "GET", url: "/api/toc/get", data: query,
                    success: function(data) {
                        var diff = _toc.setSourceCount(skey, data.rows[0].value);
                        if(diff < 0) 
                            _decreaseTotalDocs(-diff);
                        else if(diff > 0) 
                            _increaseTotalDocs(diff);
                       
                        _setTotalViewDocs(data.rows[0].value);
                        
                    }
                });   
            }
            $.ajax({
                type: "GET",
                url: "/api/list/docs",
                data: query,
                success: function(data) {
                    _gotItemsByFeed(data)                    
                }
            });                        
            if(!start_key) {
                _feedView = skey;
                _feedViewName = feed_title
                _setViewName(feed_title);
                _mainline.showSpinner();
            }
            return false;
        },
        getIndexItems: function(initial, start_key) {  
            if(initial !== true && !start_key) {
                _setViewName('');
                _mainline.showSpinner();
            }
            _feedView = false;
            _feedViewName = 'Home'
            this.hideSettings();
            $.ajax({
                type: "GET",
                url: "/api/list/docs",
                data: ((start_key !== undefined) ? 'startkey='+encodeURIComponent(JSON.stringify(start_key)): false),
                success: function(data) {
                    _gotItemsByFeed(data, true);                    
                }
            });
            if(!start_key) {
                _hideViewElements();
                _toc.load();
            }
            return false;
        },    
        getNextItems: function(start_key) {
            if(_feedView !== false) {
                this.getItemsByFeed(_feedView, _feedViewName, start_key)
            } else {
                this.getIndexItems(false, start_key)
            }   
            _mainline.showNextSpinner();
        },
        showSettings: function() {
            $('#content').hide();
            $('#nav').hide();
            $('#settings').show();            
            $('#settings-nav').show();
            _settings = true;
            this.showSourceForm();            
        },
        hideSettings: function() {
            $('#settings').hide();
            $('#settings-nav').hide();
            $('#content').show();
            $('#nav').show();
            _settings = false;  
        },
        showTab: function(id) {
            $('#settings .tabrow .selected').removeClass('selected');
            $('#settings .tab-active').removeClass('tab-active').hide();
            $('#tab-'+id).addClass('selected');
            $('#settings .tab').hide();
            $('#'+id).addClass('tab-active').show();
        },
        showSourceForm: function() {
            this.showTab('source-form');
            $('#subs-list').html('');
            var form = new FeedForm();
            form.showForm()            
        },
        showSourcesList: function () {
            this.showTab('sources-list');
            $('#subs-list').html('');
            var form = new SubsForm();
            form.showForm()  ;             
        },
        showAbout: function() {
            this.showTab('about');
        },
        unsubscribe: function(link) {
            console.log(link);
        }
    }
});

define('controller', ["toc","mainline","helpers", "forms"], function(toc, mainline, helpers, forms) {
    return new Controller(socket, toc);    
});    