enyo.kind({
    name: "TocItem",
    kind: enyo.Control,
    tag: "li",
    attributes: {
        'data-source': '',
        'data-title': ''
        
    },
    published: {    
        title: "",
        sum: 0, 
        source: ''
    },
   components: [
        {name: "title", classes: "toc-title", content: ""},
        {name: "sum", classes: "toc-sum", content: ""}   
   ],
   
    create: function() {
        this.inherited(arguments);
        this.setData();
    },

    setData: function() {
        this.$.title.setContent(this.title);
        this.attributes['data-title'] = this.title;
        this.$.sum.setContent(this.sum);
        this.attributes['data-title'] = this.source;
    },
    
});