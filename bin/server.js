/**
 * Copyright (c) 2012, Martin Borho. 
 * Licensed under the Affero General Public License version 3 or later. 
 * See LICENSE for details.  
 */
var nconf = require('nconf')
    , lib = require('../lib')
    , express = require('express')
    , socket_io = require('socket.io')
    , passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy
    , sessionStore = new express.session.MemoryStore({ reapInterval: 60000 * 10 })
    , parseCookie = require('connect').utils.parseCookie
    , sanitize = require('validator').sanitize
    , _base_path = __dirname+'/..';


nconf.use('file', { file: _base_path+'/config.json' });
nconf.load();

// db connection
var db = lib.storage.getDb(nconf.get('db'))

// libs and services
if(nconf.get('twitter:enabled')) {
    var twit = new lib.twitter.Twitter(nconf.get('twitter'), db);
    twit.userstream(nconf.get('twitter:user'));
}

if(nconf.get('superfeedr:enabled')) {
    lib.superfeedr.listen(db, nconf.get('superfeedr'));
}

if(nconf.get('poller:enabled')) {
    var poller = new lib.Poller(db);
    poller.start();
}

var connector = new lib.connector.Connector(db);

var app = express.createServer();
var io = socket_io.listen(app);
io.set('log level', 2)
var _SOCKET_ENDPOINT = '';

passport.use(new LocalStrategy(
    function(username, password, done) {
        if(username == nconf.get('app:user') && password == nconf.get('app:password')) {
            return done(null, {id: username});
        } else {
            return done(null, false);
        }
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
//   User.findOne(id, function (err, user) {
    done(null,  {id: id});
//   });
});

function checkSession(req, res, next) {
    if(req.user !== undefined) {
        next();
        return;
    }
    res.writeHead(301, {'Location':'/login'});
    res.end();    
}

function checkAjaxSession(req, res, next) {
    if(req.user !== undefined) {
        next();
        return;
    }
    console.log('AJAX UNAUTHORIZED');
    res.writeHead(401);
    res.end();       
}

// express configuration
app.configure(function() {
    app.use(express.static(_base_path + '/lib/static'));
    app.set('views', _base_path + '/lib/views');
    app.set('view engine', 'ejs');
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.session({store: sessionStore, secret: 'keyboard cat' }));
    app.use(passport.initialize());
    app.use(passport.session()); 
    app.use(app.router);
    //app.use(basic_auth);
});

// routes 
app.get('/login', function(req, res){
    res.render('login', {layout: false});  
});

app.post('/login',
  passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' })
);

app.get('/logout', function(req, res){
  req.logOut();
  res.redirect('/');
});

app.get('/', checkSession,  function(req, res){
    res.render('index', {locals: {
        title: 'Test',
        docs: false,//docs,
        socket_endpoint: _SOCKET_ENDPOINT
    }});  
});

app.get('/api/list/docs', checkAjaxSession, function(req, res){ 
    var skey = (req.query["id"]) ? sanitize(req.query["id"]).xss() : false;
    var startkey = (req.query["startkey"]) ? sanitize(req.query["startkey"]).xss() : false;
    if(skey && skey !== "") {
        connector.get_source_docs(res, skey, startkey);
    } else {       
        connector.get_index_docs(res, startkey);
    }        
}); 

app.get('/api/list/docs/json', checkAjaxSession, function(req, res){ 
    var skey = (req.query["id"]) ? sanitize(req.query["id"]).xss() : false;
    var startkey = (req.query["startkey"]) ? sanitize(req.query["startkey"]).xss() : false;
    if(skey && skey !== "") {
        connector.get_source_json(res, skey, startkey);
    } else {       
        connector.get_index_json(res, startkey);
    }        
});

app.get('/api/toc/get', checkAjaxSession, function(req, res) {
    var skey = (req.query["id"]) ? sanitize(req.query["id"]).xss() : false;
    connector.get_toc(res, skey);
});

app.post('/api/subs/add', checkAjaxSession, function(req, res) {
    connector.add_sub(req, res, nconf.get('superfeedr:enabled'));
});

app.post('/api/subs/remove', checkAjaxSession, function(req, res) {
    connector.remove_sub(req, res, nconf.get('superfeedr:enabled'));
});

app.get('/api/subs/list', checkAjaxSession, function(req, res) {
    connector.get_subs(req, res);
});

io.set('authorization', function (data, accept) {
    var cookies = parseCookie(data.headers.cookie),
        sessionId = cookies['connect.sid'];
    if(!sessionId) {
        console.log('no session id');
        return accept('No session id transmitted.', false);
    } else {    
        sessionStore.get(sessionId, function(err, session) {
            if(err) {
                return accept(err, false);            
            } else if(session) {
                data.sessionId = sessionId;
                data.user = session.passport.user;
                return accept(null, true);
            }
            return accept('No cookie transmitted.', false);
        });
    }
});

var pipe = io.sockets.on('connection', function (socket) {
    socket.on('removeDoc', function (doc) {
//         console.log(socket.handshake.sessionId+' :: '+socket.handshake.user);
        connector.remove_doc(socket, doc);
    });    
    socket.on('removeDocs', function (data) {
        connector.remove_docs(socket, data);
    });    
    socket.on('getFeedDocs', function (data) {
        if(data) {
            connector.get_feed_docs(socket, data);
        } else {
            connector.get_index_docs(socket);
        }
    });
});

var initializeStream = function() {
    db.info(function(err, info) {
        var query = {};
        if (err) {
            throw new Error(JSON.stringify(err));    
            console.log("error on stream reconnect");        
            console.log(JSON.stringify(err));        
        }
        console.log("db info fetched");
        query = {
                include_docs:true,
                since:info.update_seq
        } 
        console.log("Changes stream starting");  
        db.changes(query).on('response', function (res) { 
            res.on('data', function (change) {
                if(change.deleted == undefined 
                    && (change.doc.type == "newsitem" 
                            || change.doc.type == "tweet"
                                    || change.doc.type == "xmpp")) {
                    connector.process_pushed(change.doc, pipe);
                } /*else {
                    pipe.emit('syncDeleted', { doc: change.doc });
                }*/
            });
            res.on('end', function () {
                console.log("Changes stream ended, try restarting");        
                initializeStream();
            });
        });
    });
};
initializeStream();

app.listen(nconf.get('app:port'), function () {
  var addr = app.address();
  console.log(' app listening on http://' + addr.address + ':' + addr.port);
});
