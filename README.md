## SiloZippr

SiloZippr aims to be a push-based realtime newsreader. It can combine various timelines into a single one. And if you've read the news, you simply delete them from the database. No need to build another silo...

#### SiloZippr is realtime in two ways:

- It combines [node.js](http://nodejs.org), [WebSockets](https://en.wikipedia.org/wiki/Web_Sockets) and [Apache CouchDB](http://couchdb.apache.org/) to build a newsreader, where every new entry to the database will get pushed to your browser, which gives you a down-to-zero delay compared to traditional polling.
- By using [superfeedr.com](http://superfeedr.com) you can get updates pushed to you. And when the subscribed feed enables [Pubsubhubbub](https://en.wikipedia.org/wiki/PubSubHubbub) (also known as PuSH) even with no delay. Services using PuSH: wordpress.com, stackoverflow.com, feedburner.com, Google Alerts etc

#### At the moment three different sources can be used to fill SiloZippr with new entries:

* traditional rss/atom feed polling through a builtin feed aggregator.
* [superfeedr.com](http://superfeedr.com) through their XMPP API. Superfeedr is a really cool service, which handles the feed aggregation in realtime for you. Means: If Superfeedr detects updates for a subscribed feed, SiloZippr gets a push notification from Superfeedr. If the subscribed feed enables Pubsubhubbub the updates will happen in realtime. In fact Superfeedr is a paid service, but new users have 25000 notifications for free at start, so you can test it without any hassle.
* [Twitter](http://twitter.com) through their [streaming-api](https://dev.twitter.com/docs/streaming-api). You will get new tweets in your timeline with zero delay.

#### Current status
Early beta

#### Installation

- Install node.js. https://github.com/joyent/node/wiki/Installation or https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager
* Install "libexpat1-dev" for node-xmpp
* Install silozippr:

```
 git clone git@github.com:mborho/silozippr.git silozippr
 cd silozippr
 npm install
 node bin/server.js
```
#### Setup 
Copy config.json.example to config.json. Single services can be enabled/disabled. 

* add the credentials for your CouchDb. You can of course use free CouchDB services like [IrisCouch](http://www.iriscouch.com/service) or [Cloudant](https://cloudant.com/#!/solutions/)!
* add your login data into the app section
* to setup twitter delivery, got to http://dev.twitter.com to create an app and add the required tokens to the twitter part of json.config
* to enable Superfeedr enter your login and password to the Superfeedr part of the config.json

#### Dependencies
One module, [cradle](https://github.com/cloudhead/cradle), is bundled with SiloZippr, since it's patched. Waiting for the module getting updated with the bugfixe, so it can be removed from this repository.

Further used:

- [bootstrap](http://twitter.github.com/bootstrap/index.html) is used as css framework
- [gentleface](http://gentleface.com/free_icon_set.html) icons

#### Process monitoring
It's recommended to use a process monitor like [Supervisord](http://supervisord.org/) to run SiloZippr.

#### What's on the TODO list?
- distribe via NPM
- archive function
- share items with the world through a pubsubhubbub enabled feed
- integration of services to share items, like instapaper, bookmark services etc.
- more twitter features like posting status updates, retweeting and inline media.
- handling of malicious markup
- rebuild UI with Enyo
- add clients for more silos, like G+ for example
- reduce dependencies
- get it run on PaaS platforms lke http://nodester.com or http://cloudno.de. Problem is node-xmpp dependencies.
- test, tests

#### License (Affero GPL 3)

Copyright (C) 2012  Martin Borho

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see http://www.gnu.org/licenses/.
