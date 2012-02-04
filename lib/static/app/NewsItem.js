enyo.kind({
    name: "NewsItem",
    kind: enyo.Control,
    classes: "twelve columns round-5 line-item news",
    attributes: {
        'data-doc-source': '',
        'data-doc-rev': '',
        'data-doc-id': ''
    },
    published: {   
        source:'',
        rev: '',
        doc_id: '',
        title: '',
        publisher: '',
        date: '',
        href: '',
        body: ''
    },
    components: [
        {classes: "line-meta", components: [
            {name:"date", classes:"line-date"},        
            {tag: "a", classes:"line-del", content: "&#160;"}
        ]},
        {classes: "line-content", components: [
            {classes: "line-source", components: [
                {tag: "a", name: "publisher"},
            ]},
            {classes: "line-title", components: [
                {tag: "a", href:"", name: "title"},
            ]},
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
        this.$.publisher.setContent = this.publisher;
        this.$.title.setContent(this.title);
        this.$.title.setAttribute('href',this.href);
        this.$.body.setContent(this.body);
    },
    
});
    
/**
 * 
   
   
                <div data-doc-source="9a3dc72604878894e69a1746da78eb3c" data-doc-rev="1-461fcb326304554845b1ef2dbf390f55" data-doc-id="81cfae715b1be00c5c5eddbfd1baa1af" id="box-81cfae715b1be00c5c5eddbfd1baa1af" 
                    class="twelve columns  round-5 line-item tweet">
                        <div class="line-meta">
                            <div class="line-date">
                                <a onclick="Controller.getItemsByFeed('9a3dc72604878894e69a1746da78eb3c', 'Twitter');return false;">
                                    <img src="/img/twitter.png">
                                    </a><a href="https://twitter.com/malomalo/status/165716401833771008" class="tweet-link">09:40</a> retweeted by <a href="https://twitter.com/fholzhauer">@fholzhauer</a>
                            </div>
                            <a onclick="Controller.deleteDoc('box-81cfae715b1be00c5c5eddbfd1baa1af');" class="line-del">&nbsp;</a>
                        </div>
                        <div class="line-content">
                            <div class="line-body">
                                <a href="https://twitter.com/malomalo"><img src="http://a0.twimg.com/profile_images/535787113/js_normal.jpg"></a> <a href="https://twitter.com/malomalo">malomalo</a>: haha. <a href="http://cooksuck.com/">cooksuck.com</a> [via <a href="https://twitter.com/tauben">@tauben</a>. mir sind die food-fotografen alle wahnsinnig sympatisch. gutes food blog gegengift]
                            </div>
                        </div>
                </div>
                
                
*/                