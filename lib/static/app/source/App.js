enyo.Scroller.touchScrolling = !enyo.Scroller.hasTouchScrolling();

enyo.kind({
    name: "App",
    kind: "Control",
    classes: "onyx",
    components: [
        {kind: "onyx.Toolbar", components: [
            { kind: "onyx.Button", content: "Load", ontap: "loadList" },
        ]},
        {name: "results", kind: "Scroller", horizontal: "hidden", style: "top:55px", classes: "enyo-fit list enyo-unselectable"},
        {name: "loginPopup", kind: "onyx.Popup", centered: true, modal: true, floating: true, components: [
//             {content: "Here's some information..."}
            {kind: "onyx.Groupbox", components: [
                {kind: "onyx.GroupboxHeader", content: "Login"},
                    {kind: "onyx.InputDecorator", components: [
                        {kind: "onyx.Input"}
                    ]},
                    {kind: "onyx.InputDecorator", components: [
                        {kind: "onyx.Input", type:"password"}
                    ]},
                    {kind: "onyx.Button", content: "Login", classes: "onyx-affirmative"}
                ]}
        ]},

    ],
    create: function() {
        this.inherited(arguments);
        this.loadOnStart();
    },
    loadOnStart: function() {        
        for(var x=0;x< 200;x++) {
            this.$.results.createComponent({content: "item "+x, classes: "item", 
                                           /*ontap: "select", data: r, */owner: this, attributes: {draggable: false}});
        }
    },
    loadList: function(inSender, inEvent) {
        console.log(inSender);
        console.log(inEvent);                
        this.$.loginPopup.show();
    },
});