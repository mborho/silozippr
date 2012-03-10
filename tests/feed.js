var subscription  = require('../lib/feed.js');

describe('Feed', function(){
    var foo = null;
    
    before(function(done) {
        foo = 'bla';
        done();
    });
    
    beforeEach(function() {
        // Ran before each test.        
    });
    
    it('test rdf feed', function(done){
        
        var url = 'http://www.heise.de/newsticker/heise.rdf',
            feed = new subscription.FeedLoader(url, cb);
        function cb(err, feed) {
            if(feed === undefined) {
                done(new Error("Error: Response not defined"));            
            } else if( feed.valid !== true ) {
                done(new Error("Error: No feed found"));                
            } else if( feed.pubSubHub !== false ) {
                done(new Error("Error: PubSubHub found"));                                
            } else if( feed.title !== "heise online News" ) {
                done(new Error("Error: Title not found"));
            } else if( feed.subtitle !== "Nachrichten nicht nur aus der Welt der Computer" ) {
                done(new Error("Error: Subtitle not found"));                                                 
            } else if( feed.link !== "http://www.heise.de/newsticker/" ) {
                done(new Error("Error: Link not found"));
            } else if( feed.entries[0].published === undefined ) {
                done(new Error("Error: Published not found"));                                                                 
            } else {
                done(); // Success. No error for now.
            }
        }                
        feed.load();                            
    });

    it('test rss feed', function(done){
        
        var url = 'http://www.spiegel.de/schlagzeilen/tops/index.rss',
            feed = new subscription.FeedLoader(url, cb);
        function cb(err, feed) {
            if(feed === undefined) {
                done(new Error("Error: Response not defined"));            
            } else if( feed.valid !== true ) {
                done(new Error("Error: No feed found"));                
            } else if( feed.pubSubHub !== false ) {
                done(new Error("Error: PubSubHub found"));                                
            } else if( feed.title !== "SPIEGEL ONLINE - Schlagzeilen" ) {
                done(new Error("Error: Title not found"));
            } else if( feed.subtitle === "" ) {
                done(new Error("Error: Subtitle not found"));                                                 
            } else if( feed.link !== "http://www.spiegel.de" ) {
                done(new Error("Error: Link not found"));  
            } else if( feed.entries[0].published === undefined ) {
                done(new Error("Error: Published not found"));                 
            } else {
                done(); // Success. No error for now.
            }
        }                
        feed.load();                            
    });
    
    it('test hubbub feed', function(done){
        
        var url = 'http://stackoverflow.com/feeds/tag?tagnames=c%23&sort=newest',
            feed = new subscription.FeedLoader(url, cb);
            
        function cb(err, feed) {
            if(feed === undefined) {
                done(new Error("Error: Response not defined"));            
            } else if( feed.valid !== true ) {
                done(new Error("Error: No feed found"));                
            } else if( feed.pubSubHub !== "http://pubsubhubbub.appspot.com/" ) {
                done(new Error("Error: No PubSubHub found"));    
            } else if( feed.title !== "newest questions tagged c# - Stack Overflow" ) {
                done(new Error("Error: Title not found"));
            } else if( feed.subtitle !== "most recent 30 from stackoverflow.com" ) {
                done(new Error("Error: Subtitle not found"));                                                 
            } else if( feed.link !== "http://stackoverflow.com/questions/tagged/?tagnames=c%23&sort=newest" ) {
                done(new Error("Error: Link not found"));      
            } else if( feed.entries[0].published === undefined ) {
                done(new Error("Error: Published not found"));                 
            } else {
                done(); // Success. No error for now.
            }
        }                
        feed.load();                            
    });

    it('test atom feed', function(done){
    
        var url = 'http://feeds2.feedburner.com/blogspot/Dcni',
            feed = new subscription.FeedLoader(url, cb);
            
        function cb(err, feed) {
            if(feed === undefined) {
                done(new Error("Error: Response not defined"));            
            } else if( feed.valid !== true ) {
                done(new Error("Error: No feed found"));                
            } else if( feed.pubSubHub !== "http://pubsubhubbub.appspot.com/" ) {
                done(new Error("Error: No PubSubHub found"));    
            } else if( feed.title !== "Google Code Blog" ) {
                done(new Error("Error: Title not found"));
            } else if( feed.subtitle !== "Updates from Google\'s open source projects." ) {
                done(new Error("Error: Subtitle not found"));                                                 
            } else if( feed.link !== "http://googlecode.blogspot.com/" ) {
                done(new Error("Error: Link not found"));      
            } else if( feed.entries[0].published === undefined ) {
                done(new Error("Error: Published not found"));                 
            } else {
                done(); // Success. No error for now.
            }
        }                
        feed.load();                            
    });
    
    it('test atom feed 2', function(done){
    
        var url = 'http://stackoverflow.com/feeds/tag/javascript',
            feed = new subscription.FeedLoader(url, cb);
            
        function cb(err, feed) {            
            if(feed === undefined) {
                done(new Error("Error: Response not defined"));            
            } else if( feed.valid !== true ) {
                done(new Error("Error: No feed found"));                
            } else if( feed.pubSubHub !== "http://pubsubhubbub.appspot.com/" ) {
                done(new Error("Error: No PubSubHub found"));    
            } else if( feed.title !== "active questions tagged javascript - Stack Overflow" ) {
                done(new Error("Error: Title not found"));
            } else if( feed.subtitle !== "most recent 30 from stackoverflow.com" ) {
                done(new Error("Error: Subtitle not found"));                                                 
            } else if( feed.link !== "http://stackoverflow.com/questions/tagged/?tagnames=javascript&sort=active" ) {
                done(new Error("Error: Link not found"));      
            } else if( feed.entries[0].published === undefined ) {
                done(new Error("Error: Published not found"));                 
            } else {
                done(); // Success. No error for now.
            }
        }                
        feed.load();                            
    });    
    
    it('load invalid url', function(done){
    
        var url = 'http://borho.net/',
            feed = new subscription.FeedLoader(url, cb);
            
        function cb(err, feed) {   
            if(err === null && feed !== undefined) {
                done(new Error("Error: Feed found")); // Success. No feed.
            } else {
                done();
            }
        }                
        feed.load();                            
    });    
});