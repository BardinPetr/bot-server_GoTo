const DEBUG = true;

var http = require('http');
var path = require('path');
var moment = require("moment");

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

var mongo = require('mongodb').MongoClient,
    assert = require('assert');
var url = 'mongodb://localhost:27017/goto_bot';

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var sockets = [];

var plan_text = "";
var info_text = "";
var achiev_arr = [];

global.db_plan_text;
global.db_info_text;
global.db_achiev_arr;
global.ok = false;

setInterval(update15, 5000);
setInterval(update5, 5000);
setInterval(update1, 1000);

function update1(){
  broadcast('time', moment().utc().format('h:mm:ss a'));
}
function update5() {
  broadcast('r_ach', dbarr_to_str(global.db_achiev_arr));
}

function update15(){
  mongo.connect(url, function(err, db) {
    assert.equal(null, err);

    getdb(db, 'info', function() {
      getdb(db, 'timetable', function() {
        getdb(db, 'achievements', function() {
          db.close();
          
          log("[db] Information: ");
          log(global.db_info_text);
          log("[db] Dayplan: ");
          log(global.db_plan_text);  
          log("[db] Achievements: ");
          log(global.db_achiev_arr);
          
          if(!global.ok)
            start_srv();
          global.ok = true;
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
        global.db_info_text = docs[0].body;
        break;      
      case 'timetable':
        global.db_plan_text = docs[0].body;
        break;      
      case 'achievements':
        global.db_achiev_arr = docs[0].body;
        break;
    }
    callback(docs[0].body);
  });      
};

var setdb = function(col, data, callback) {
  mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    var collection = db.collection(col);
    if(col != 'achievements'){
      collection.updateOne({"main": true}, 
                   { $set: { "body" : data } }, 
                   function(err, result) {
                      assert.equal(err, null);
                      assert.equal(1, result.result.n);
                      callback(); } );  
    } 
    else{
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

function log(data){
  if(DEBUG)
    console.log(data);
}

function dbarr_to_str(data) {
  var out = [];
  try{
    for(var i = 0; i < data.length; i++){
      out[i] = data[i].join(': ');
    }
    return out.join('\n');
  } catch(E){
    
  }
  return "";
}
function str_to_dbarr(data) {
  try{
    var prearr = data.split("\n");
    for(var i = 0; i < prearr.length; i++){
      prearr[i] = prearr[i].split(": ");
    }
    return prearr
  } catch(E){
    
  }
  return [];
}

 
io.on('connection', function (socket) {
  if(global.ok){
    sockets.push(socket);
    
    broadcast('r_dayplan', dbarr_to_str(global.db_plan_text));
    broadcast('r_info', global.db_info_text);
    broadcast('r_ach', dbarr_to_str(global.db_achiev_arr));

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
    });
  
    //DAY PLAN
    socket.on('dayplan', function (msg) {
      setdb('timetable', str_to_dbarr(msg), function(){});
      log("New dayplan recieved: \n" + msg);
    });    
    
    socket.on('req_dayplan', function (msg) {
      log("Dayplan requested");
      broadcast('r_dayplan', dbarr_to_str(global.db_plan_text));
    });  
    
    //INFORMATION
    socket.on('newinfo', function (msg) {
      setdb('info', msg, function(){});
      log("New info recieved: \n" + msg);
    });    
    
    socket.on('req_info', function (msg) {
      log("Info requested");
      broadcast('r_info',  global.db_info_text);
    });  
    
    //MESSAGES
    socket.on('newmsg', function (msg) {
      log("New message recieved: " + msg);
    });
    
    //ACHIEVEMENTS
    socket.on('newach', function (msg) {
      setdb('achievements', str_to_dbarr(msg), function(){});
      log("New achievement recieved: \n" + msg);
    });    
    
    socket.on('req_ach', function (msg) {
      log("Ach requested");
      broadcast('r_ach', dbarr_to_str(global.db_achiev_arr));
    });  
  }
});


function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

function start_srv(){
  server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
    var addr = server.address();
    log("Server listening at", addr.address + ":" + addr.port);
  });
}