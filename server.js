var http = require('http');
var path = require('path');

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

setInterval(update_data, 1000);
function update_data(){
  
}

io.on('connection', function (socket) {
  sockets.push(socket);
  
  broadcast('r_dayplan', plan_text);
  broadcast('r_info', info_text);

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
