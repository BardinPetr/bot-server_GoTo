const DEBUG = true;

var http = require("http");
var path = require("path");
var moment = require("moment");

var socketio = require("socket.io");
var express = require("express");

var mongo = require("mongodb").MongoClient;
var assert = require("assert");
var url = "mongodb://localhost:27017/goto_bot";

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

var u = require("./util.js");

router.use(express.static(path.resolve(__dirname, "client")));
var sockets = [];

global.db_plan_text;
global.db_info_text;
global.db_achiev_arr;
global.ok = false;

function update1() {
  broadcast("time", moment().utc().utcOffset("+03:00").format("H:mm:ss"));
  broadcast("r_ach", u.dbarr_to_str(global.db_achiev_arr));
}

function start_srv() {
  server.listen(process.env.PORT || 80, process.env.IP || "127.0.0.1", function() {
    var addr = server.address();
    u.log("Server listening at", addr.address + ":" + addr.port);

    setInterval(update1, 1000);
  });
}

function updatedb() {
  mongo.connect(url, function(err, db) {
    assert.equal(null, err);

    getdb(db, "info", function() {
      getdb(db, "timetable", function() {
        getdb(db, "achievements", function() {
          db.close();
          if (!global.ok) {
            start_srv();
          }
          global.ok = true;

          updatedb();
        });
      });
    });
  });
}


function getdb(db, col, callback) {
  var collection = db.collection(col);
  collection.find({
    "main": true
  }).toArray(function(err, docs) {
    assert.equal(err, null);
    switch (col) {
      case "info":
        global.db_info_text = docs[0].body;
        break;
      case "timetable":
        global.db_plan_text = docs[0].body;
        break;
      case "achievements":
        global.db_achiev_arr = docs[0].body;
        break;
    }
    callback(docs[0].body);
  });
}

function setdb(col, data, callback) {
  mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    var collection = db.collection(col);
    if (col !== "achievements") {
      collection.updateOne({
          "main": true
        }, {
          $set: {
            "body": data
          }
        },
        function(err, result) {
          assert.equal(err, null);
          assert.equal(1, result.result.n);
          callback();
        });
    }
    else {
      getdb(db, "achievements", function(data1) {
        var pre = data1.concat(data);
        collection.updateOne({
            "main": true
          }, {
            $set: {
              "body": pre
            }
          },
          function(err, result) {
            assert.equal(err, null);
            assert.equal(1, result.result.n);
            callback();
          });
      });
    }
  });
}



function broadcast(event, data) {
  sockets.forEach(function(socket) {
    socket.emit(event, data);
  });
}

io.on("connection", function(socket) {
  if (global.ok) {
    sockets.push(socket);

    broadcast("r_dayplan", u.dbarr_to_str(global.db_plan_text));
    broadcast("r_info", global.db_info_text);
    broadcast("r_ach", u.dbarr_to_str(global.db_achiev_arr));

    socket.on("disconnect", function() {
      sockets.splice(sockets.indexOf(socket), 1);
    });

    //DAY PLAN
    socket.on("dayplan", function(msg) {
      setdb("timetable", u.str_to_dbarr(msg), function() {});
      u.log("New dayplan recieved: \n" + msg);
    });

    socket.on("req_dayplan", function() {
      u.log("Dayplan requested");
      broadcast("r_dayplan", u.dbarr_to_str(global.db_plan_text));
    });

    //INFORMATION
    socket.on("newinfo", function(msg) {
      setdb("info", msg, function() {});
      u.log("New info recieved: \n" + msg);
    });

    socket.on("req_info", function() {
      u.log("Info requested");
      broadcast("r_info", global.db_info_text);
    });

    //MESSAGES
    socket.on("newmsg_a", function(msg) {
      u.log("New message recieved: " + msg);
      broadcast("msg_fromweb_a", msg);
    });
    socket.on("newmsg_o", function(msg) {
      u.log("New message recieved (for organizers): " + msg);
      broadcast("msg_fromweb_o", msg);
    });
    socket.on("newmsg_u", function(msg) {
      u.log("New message recieved (for users): " + msg);
      broadcast("msg_fromweb_u", msg);
    });

    //ACHIEVEMENTS
    socket.on("newach", function(msg) {
      setdb("achievements", u.str_to_dbarr(msg), function() {});
      u.log("New achievement recieved: \n" + msg);
    });

    socket.on("req_ach", function() {
      u.log("Ach requested");
      broadcast("r_ach", u.dbarr_to_str(global.db_achiev_arr));
    });
  }
});


//START ALL
updatedb();
