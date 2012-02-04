enyo.kind({
    name: "TweetItem",
    kind: enyo.Control,
    classes: "twelve columns round-5 line-item tweet",
    attributes: {
        'data-doc-source': '',
        'data-doc-rev': '',
        'data-doc-id': ''
    },
    published: {   
        source:'',
        rev: '',
        doc_id: '',
        byline: '',
        date: '',
        href:'',
        body: ''
    },
    components: [
        {classes: "line-meta", components: [
            {classes: "line-date", components: [
                {tag: "a", components: [
                    {tag: "img", attributes: {src: "/img/twitter.png"}}
                ]},
                {tag:"a", name:"date", classes:"tweet-link"},
                {name:"byline", content:""},
            ]},      
            {tag: "a", classes:"line-del", content: "&#160;"}
        ]},
        {classes: "line-content", components: [
            {name: "body", classes: "line-body"},
        ]},
    ],

    create: function() {
        this.inherited(arguments);
        this.setData();
    },

    setData: function() {
        this.attributes['data-doc-source'] =  this.source;
        this.attributes['data-doc-rev'] = this.rev,
        this.attributes['data-doc-id'] = this.doc_id,        
        this.$.date.setContent(this.date);
        this.$.byline.setContent(this.byline);
        this.$.body.setContent(this.body);
    },
    
});