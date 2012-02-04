enyo.kind({
    name: "Header",
    kind: enyo.Control,
    components: [
        { tag: "ul", name: "nav", classes: "nav", components: [
            { tag: "li", name: "home", classes: "nav-button nav-bg left", content: "&#160;", onclick: "getIndexItems" },    
            { tag: "li", name: "settings", classes: "nav-button nav-bg left", content: "&#160;", onclick: "showSettings" },    
            { tag: "li", name: "more", classes: "nav-button nav-bg left", content: "&#160;" },    
            { tag: "li", name: "total", classes: "nav-button left", content: "0" },            
            { tag: "li", name: "delete", classes: "nav-button nav-bg right", content: "&#160;", onclick: "deleteInView" },    
            { tag: "li", name: "expand", classes: "nav-button nav-bg right", content: "&#160;", onclick: "expand" },    
            { tag: "li", name: "viewTotal", classes: "nav-button right hidden", showing:false, content: "0" }    
        ]},
        { tag:"ul", name: "settings_nav", classes: "nav", showing: false, components:[
            {tag:"li", name: "back", onclick: "hideSettings", classes: "nav-button nav-bg left", content: "&#160;" }        
        ]}        
    ],

    create: function() {
        this.inherited(arguments);
        this.owner = this.getOwner();        
    },
    
    deleteInView: function() {        
        enyo.log('deleteinview');      
    },
    
    getIndexItems: function() {
        console.log('getIndexItems');      
    },
    
    showSettings: function() {
        this.$.nav.hide();
        this.$.settings_nav.show();
    },
    
    hideSettings: function() {
        this.$.settings_nav.hide();
        this.$.nav.show();
    },
    
    expand: function() {
        console.log('expand');      
    },
  
});         