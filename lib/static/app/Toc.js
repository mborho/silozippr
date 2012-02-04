enyo.kind({
    name: "Toc",
    kind: enyo.Control,
    classes: "two columns",
    style: "min-width:220px",
    components: [
        { name: "box", classes: "twelve columns", components: [
            {tag: "ul", name: "list", classes: "toc-list"},
        ]},
    ],
    
    create: function() {
        this.inherited(arguments);
        this.owner = this.getOwner();
        this.load();
    },
    
    load: function() {        
//         var params = {q: inRelated ? null : inSearchText, alt: "json", format: 5};
        new enyo.Ajax({url: "/api/toc/get"}).go().response(this, "build");
    },
    
    build: function(inSender, inResponse) {
        enyo.forEach(inResponse.rows, this.addItem, this);
        this.$.list.render();
    },
    
    addItem: function(row) {
       this.createComponent({
            kind: "TocItem",
            container: this.$.list,
            title: row.key[1],
            sum: row.value,
            source: row.key[0]      
        });                     
    }
        
  
});  

/**
 *     this.createComponent({
      kind: Tweet,
      container: this.$.tweetList,
      icon: "touchhead_sq_normal.jpg",
      handle: "unwiredben", 
      text: "A new tweet! #" + this.nextTweetNumber
    });
    
*/    