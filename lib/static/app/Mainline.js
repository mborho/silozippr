enyo.kind({
    name: "Mainline",
    kind: enyo.Control,
    classes: "eight columns",
    components: [],
    
    create: function() {
        this.inherited(arguments);
        this.owner = this.getOwner();        
        this.loadIndex();
    },
  
    loadIndex: function() {        
//         var params = {q: inRelated ? null : inSearchText, alt: "json", format: 5};
        new enyo.Ajax({url: "/api/list/docs/json"}).go().response(this, "build");
    },
    
    build: function(inSender, inResponse) {
        enyo.forEach(inResponse.docs, this.addItem, this);
        this.render();
        $('body').height(($('#app_mainline').height()+100));
    },
    
    addItem: function(row) {        
        this.createComponent(row);
    },
    
    resizeHandler: function() {
        //this.validateLayout();
        $('body').height(($('#app_mainline').height()+100));
        console.log('resized');
    },    

}); 