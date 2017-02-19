var http = require('http');
var path = require('path');
var moment = require("moment");

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var sockets = [];

var plan_text = "raspisanie\nraspisanie1:10.11";
var info_text = "zdes dolhna bit informatsia";
var achiev_arr = [];

setInterval(update5, 5000);
setInterval(update1, 1000);
function update5(){
  broadcast('r_ach', achiev_arr.join(';'));
};
function update1(){
  broadcast('time', moment().utc().format('h:mm:ss a'));
};

io.on('connection', function (socket) {
  sockets.push(socket);
  
  broadcast('r_dayplan', plan_text);
  broadcast('r_info', info_text);
  broadcast('r_ach', achiev_arr.join(';'));
  
  socket.on('disconnect', function () {
    sockets.splice(sockets.indexOf(socket), 1);
  });

  //DAY PLAN
  socket.on('dayplan', function (msg) {
    plan_text = msg;
    console.log("New dayplan recieved: \n" + msg);
  });    
  
  socket.on('req_dayplan', function (msg) {
    console.log("Dayplan requested");
    broadcast('r_dayplan', plan_text);
  });  
  
  //INFORMATION
  socket.on('newinfo', function (msg) {
    info_text = msg;
    console.log("New info recieved: \n" + msg);
  });    
  
  socket.on('req_info', function (msg) {
    console.log("Info requested");
    broadcast('r_info', info_text);
  });  
  
  //MESSAGES
  socket.on('newmsg', function (msg) {
    console.log("New message recieved: " + msg);
  });
  
  //ACHIEVEMENTS
  socket.on('newach', function (msg) {
    achiev_arr = achiev_arr.concat(msg);
    console.log(achiev_arr);
    console.log("New achievement recieved: \n" + msg);
  });    
  
  socket.on('req_ach', function (msg) {
    console.log("Ach requested");
    broadcast('r_ach', achiev_arr.join(';'));
  });  
});


function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Server listening at", addr.address + ":" + addr.port);
});
