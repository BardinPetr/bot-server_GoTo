The Camp Coordinator bot. 
===================== 
[![Travis](https://img.shields.io/travis/BardinPetr/bot-server_GoTo.svg?style=flat-square)](https://travis-ci.org/BardinPetr/bot-server_GoTo)  [![Github All Releases](https://img.shields.io/github/downloads/BardinPetr/bot-server_GoTo/total.svg?style=flat-square)](https://github.com/BardinPetr/bot-server_GoTo)  [![GitHub tag](https://img.shields.io/github/tag/BardinPetr/bot-server_GoTo.svg?style=flat-square)](https://github.com/BardinPetr/bot-server_GoTo/tags)  [![GitHub release](https://img.shields.io/github/release/BardinPetr/bot-server_GoTo.svg?style=flat-square)](https://github.com/BardinPetr/bot-server_GoTo/releases)  [![Codacy grade](https://img.shields.io/codacy/grade/32431a32ce774d4c836cefbb6e20f683.svg?style=flat-square)](https://www.codacy.com/app/BardinPetr/bot-server_GoTo)

----------
This Telegram bot was made for spring GoTo Camp Challenge. 
Main features: 
-------------------- 
- Telegram bot 
	- __Authorization of the user__ as a student or camp organizer
	- Set / view __timetable__ 
	- Set / view __achievements__ 
	- Set / view __information__ 
	- __Automatic sending__ timetable tasks *on-time* and *15 minutes before* 
	- __Automatic notification sending__ for all user when data (timetable, etc.) is updated 
- Web control page (admin panel)  
	- Set / view __timetable__ 
	- Set / view __achievements__ 
	- Set / view __information__ 

Technical description 
------------------------- 
#### Files description File 
Name | Description | Importance
----- | ------------- | -------------- 
index.js | Main file | Primary 
bot.js | Bot implementation class file | Secondary 
server.js | Web server implementation class file | Secondary 
db_worker.js | Data base work functions | Third 
util.js | Utilites functions | Third


## General characteristics
* For writing was used **Node JS**
* For writing Telegram bot was used **node-telegram-bot-api** Node JS module
* We used a **mongodb** database and **mongodb** Node JS module

All data representing arrays (achievements, schedule) can be converted from an array to a string and vice versa by using functions from the module util.js - dbarr_to_str and str_to_dbarr. Strings csn be only in this format: *{key}: {data}* (delimiter- colon with a space)
 
You can try to talk with bot on Telegram: **@CampCoordinatorBot**
[**The web server is running on Heroku now**](camp-organizer-bot.herokuapp.com)

----------

## Web server (*server.js*)
For writing backend parts were used modules **socket.io**, **express**, **http**. And there was a frontend part wrote with **Angular JS**, **Bootstrap** and **JQuery**.
#### Principle of operation
If new client was connected to server, the latest information from the database is sent to him. If the user updates the data from the web page, then the information is immediately updated to the database. 
#### Methods description
command | description 
----- | -------------
start() | Starts server 
updatedb() | Get lastest data from db (automaticly called every 10 sec) 
start_srv() | Starting server listenning. Adding handlers for socket.io (automaticly called once after first data received from database) 
broadcast(event, data) | Send some data to all connected admin-panels 
update1() | Sends data from db to web interface (automaticly called every 1 sec) 
### How to test only server:
```javascript
'use strict';
var server = require("./server.js").Server;
server = new server("Add here your database address");
server.start()
```

----------

## Bot (*bot.js*)
For writing bot were used modules **node-telegram-bot-api**(telegram bot), **moment**(time), **socket.io-client**(communicate with web interface) 
### Operation principle
When you first connect to bot (sends it /start) - you will be asked who you are - a student or camp organizer. If you select a student - you will be added to a database with a limited access - only the data reading capabilities (not changes) are available. If you select an organizer, you will be asked for a password (it is initially set as "", after entering the password you will be added to the database with full access.
After authorization you will be autamaticly notified for every element of timetable 15 min befire and on-time. All timetable will be sended to users at 7:00 pm and if it changes.
If any data updated - it will be sended to all users.
If somebody sends message it will be delivered only for specified group of users.
#### Bot commands
Command | Description
----- | -----
/start | Starts bot and the authorization process
/timetable | Shows you menu of timetable commands (get, set)
/information | Shows you menu of information commands (get, set)
/achievements | Shows you menu of timetable commands (get, set)
/messaging | Shows you menu of messaging commands (send to students or camp organizers)
#### Methods description
Command | Description |
----- | ------
start() | Starts server 
updatedb() | Get lastest data from db (automaticly called every 10 sec) 
start_bot() | Starting bot. Adding handlers for bot (automaticly called once after first data received from database) 
broadcast_t(type, text) | Send message to all users of specified group (false- students, true- camp organizers) 
broadcast_a(text) | Send message to all users 
update5() | Updates "auto timetable informer" (automaticly called every 5 sec) 
sendMainMenu() | Sends menu (main commands - look for *Bot commands*) for speceifed chat id 

### How to test only bot:
```javascript
'use strict';
var bot = require("./bot.js").Bot;
bot = new bot("Add here your database address");
bot.start()
```

----------

## How to run all
```javascript
'use strict';

var server = require("./server.js").Server;
server = new server("Add here your database address");

var bot = require("./bot.js").Bot;
bot = new bot("Add here your database address");

server.start();
bot.start();
```

# Installation
*	git clone https://github.com/BardinPetr/bot-server_GoTo.git
*	cd bot-server_GoTo
*	npm install
*	npm run (to start bot and server)


----------
*Буду надеяться, что хоть кто-нибудь поймет, что я написал выше.*
*...я без малейшего понятия, почему решил написать readme на английском.*
_...если решите, что я просто скопировал бота откуда-то - **вы ошибаетесь** . Он был написан мной._

Если бот в телеграме или страница на Heroku не работает, просьба писать сюда - bardin.petr@gmail.com