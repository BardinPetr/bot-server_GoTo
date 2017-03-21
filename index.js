'use strict';

var server = require("./server.js").Server;
server = new server("mongodb://infinity-cat.ddnsking.com:27017/goto_bot");

var bot = require("./bot.js").Bot;
bot = new bot("mongodb://infinity-cat.ddnsking.com:27017/goto_bot");

server.start();
bot.start();
