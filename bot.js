const DEBUG = true;

var TelegramBot = require('node-telegram-bot-api');

const token = '377701943:AAHl_K9HbWI90-CUxqs--mkpp64vU7Ypn3k';
var bot = new TelegramBot(token, {polling: true});

var moment = require("moment");
var mongo = require('mongodb').MongoClient,
    assert = require('assert');
var url = 'mongodb://localhost:27017/goto_bot';


global.db_plan;
global.db_info;
global.db_achiev;
global.db_users;
global.db_superusers;
global.pswd;
global.run = false;

setInterval(updatedb, 5000);

function update1(){

}
function update5(){

}

function updatedb(){
    if(!global.run)
        log("Reading DB...");
    mongo.connect(url, function(err, db) {
        assert.equal(null, err);
        
        getdb(db, 'info', function() {
          getdb(db, 'timetable', function() {
            getdb(db, 'achievements', function() {
                getdb(db, 'users', function() {
                    db.close();
                    if(!global.run){
                        start();
                        log("DB read successfull\nBot started\n");
                    }
                    global.run = true;
                });
            });
          });
        });
    });
}

var getdb = function(db, col, callback) {
  var collection = db.collection(col);
  collection.find({"main": true}).toArray(function(err, docs) {
    assert.equal(err, null);
    switch (col) {
      case 'info':
        global.db_info = docs[0].body;
        break;  
      case 'timetable':
        global.db_plan = docs[0].body;
        break;      
      case 'achievements':
        global.db_achiev = docs[0].body;
        break;
      case 'users':
        global.db_users = docs[0].body.users;
        global.db_superusers = docs[0].body.superusers;
        global.pswd = docs[0].body.password;
        break;
    }
    callback(docs[0].body);
  });      
};

var setdb = function(col, data, callback) {
  mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    var collection = db.collection(col);
    if(col == 'users'){
        getdb(db, 'users', function(data1){
            var pre1 = unique(data1.users.concat(data[0]));
            var pre2 = unique(data1.superusers.concat(data[1]));

            collection.updateOne({"main": true}, 
                 { $set: { "body" : {"users": pre1, "superusers": pre2, "password": (data[3] || data1.password)} } }, 
                 function(err, result) {
                    assert.equal(err, null);
                    assert.equal(1, result.result.n);
                    callback(); } );  
        });
    }
    else if(col != 'achievements'){
      collection.updateOne({"main": true}, 
                   { $set: { "body" : data } }, 
                   function(err, result) {
                      assert.equal(err, null);
                      assert.equal(1, result.result.n);
                      callback(); } );  
    } 
    else {
      getdb(db, 'achievements', function(data1){
        var pre = data1.concat(data);
        collection.updateOne({"main": true}, 
             { $set: { "body" : pre } }, 
             function(err, result) {
                assert.equal(err, null);
                assert.equal(1, result.result.n);
                callback(); } );  
      });
    }
  });
};

function unique(data){
    data = data.sort();
    var a = data[0], k=1;
 
    for (var i = 1; i < data.length; i++){
        if (data[i] != a){ 
            data[k]=data[i]; 
            a=data[i]; 
            k++; 
        } 
    }
    data.length = k;
    return data;
}
function log(data){
  if(DEBUG)
    console.log(data);
}

function broadcast_t(type, text){
    log("Starting broadcast sending message...")
    var arr = (type == false ? global.db_users:global.db_superusers)
    for(var i = 0; i < arr.length; i++){
        var id = arr[i];
        if (id){
            log("Sending data to " + id);
            bot.sendMessage(id, text);
        }
    }
    log("Sending finished");
}
function broadcast_a(text){
    broadcast_t(false, text);
    broadcast_t(true, text);
}

function start(){
    setInterval(update5, 5000);
    setInterval(update1, 1000);
    
    bot.onText(/\/start/, onstart);
}


//Bot action handlers
function onstart(msg, match) {
    var id = msg.chat.id;
    bot.sendMessage(id, "Привет!");
                    
    const opts = {
        reply_markup: JSON.stringify({
          keyboard: [
            ["Я студент"],
            ["Я организатор"]
          ],
          one_time_keyboard:true
        })
    };
    bot.sendMessage(msg.chat.id, 'Ты студент или организатор(преподаватель)?', opts);
    
    bot.onText(/Я студент/, function(msg, match){
        bot.sendMessage(id, "Очень хорошо! Теперь ты в системе!");
        setdb("users", [[id], []], function(){});
        return;
    });
    bot.onText(/Я организатор/, function(msg, match){
        bot.sendMessage(id, "Хорошо, но вам нужно подтвердить должность организатора паролем! Напишате мне его так: \"Мой пароль: {пароль}\"");
        bot.onText(/Мой пароль: (.+)/, function(msg, match){
            var res = match[1];
            if (res == global.pswd){
                bot.sendMessage(id, "Очень хорошо! Теперь вы в системе!");
                setdb("users", [[], [id]], function(){});
            }
            else
               bot.sendMessage(id, "Так, так! Кто-то пытается притвориться организатором?!"); 
        });
    });
}
