'use strict';

var server = require("./server.js").Server;
server = new server("mongodb://bot_std:qwertyuiopoiuytrewq@ds060009.mlab.com:60009/goto_bot");

var bot = require("./bot.js").Bot;
bot = new bot("mongodb://bot_std:qwertyuiopoiuytrewq@ds060009.mlab.com:60009/goto_bot");

server.start();
bot.start();
