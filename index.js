'use strict';

var server = require("./server.js").Server;
server = new server("");

var bot = require("./bot.js").Bot;
bot = new bot("");

server.start();
bot.start();
