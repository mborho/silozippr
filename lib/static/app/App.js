//enyo.Scroller.forceTouchScrolling = !enyo.Scroller.hasTouchScrolling();

enyo.kind({
    name: "App",
    kind: enyo.Control,
    components: [
        { kind:"Header", name: "header"}, 
        {kind: "Scroller", horizontal: false, style: "height:100%", classes: "enyo-fit list enyo-unselectable", ondragfinish: "preventDragTap", components: [
            {name:"container", classes:"row", components: [
                { kind:"Toc", name: "toc", },
                { kind:"Mainline", name: "mainline", },
            ]}
        ]}
    ],
   
       
    //* @protected
    //* Prevent taps after the user drags. This is often useful in a region that is touch scrolled.
    //* In this case a tap event will be generated only when the user does not drag.
    preventDragTap: function(inSender, inEvent) {
        inEvent.preventTap();
    },
//     //* prevent input from being focused when switching back to search view
//     preventTouchstart: function(inSender, inEvent) {
//         inEvent.preventDefault();
//     }
});  