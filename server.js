'use strict';

var DEBUG = true;

var http = require("http");
var path = require("path");
var moment = require("moment");
var assert = require("assert");
var socketio = require("socket.io");
var express = require("express");

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

var u = require("./util.js");

var db = require("./db_worker.js").db_worker;

router.use(express.static(path.resolve(__dirname, "client")));
var sockets = [];

global.db_plan_text;
global.db_info_text;
global.db_achiev_arr;
global.ok = false;

class Server {
  constructor(db_url) {
    db = new db(db_url || "mongodb://localhost:27017/goto_bot");
  }

  start() {
    this.updatedb();
  }

  update1() {
    Server.prototype.broadcast("time", moment().utc().utcOffset("+03:00").format("H:mm:ss"));
    Server.prototype.broadcast("r_ach", u.dbarr_to_str(global.db_achiev_arr));
  }

  start_srv() {
    server.listen(process.env.PORT, function() {
      var addr = server.address();
      u.log("Server listening at", addr.address + ":" + addr.port);

      setInterval(Server.prototype.update1, 1000);
      setInterval(Server.prototype.updatedb, 10000);
    });

    io.on("connection", function(socket) {
      if (global.ok) {
        sockets.push(socket);

        Server.prototype.broadcast("r_dayplan", u.dbarr_to_str(global.db_plan_text));
        Server.prototype.broadcast("r_info", global.db_info_text);
        Server.prototype.broadcast("r_ach", u.dbarr_to_str(global.db_achiev_arr));

        socket.on("disconnect", function() {
          sockets.splice(sockets.indexOf(socket), 1);
        });

        //DAY PLAN
        socket.on("dayplan", function(msg) {
          db.setdb("timetable", u.str_to_dbarr(msg), function() {});
          Server.prototype.broadcast("newdayplan_fromweb", msg);
          u.log("New dayplan recieved: \n" + msg);
        });

        socket.on("req_dayplan", function() {
          u.log("Dayplan requested");
          Server.prototype.broadcast("r_dayplan", u.dbarr_to_str(global.db_plan_text));
        });

        //INFORMATION
        socket.on("newinfo", function(msg) {
          db.setdb("info", msg, function() {});
          Server.prototype.broadcast("newinfo_fromweb", msg);
          u.log("New info recieved: \n" + msg);
        });

        socket.on("req_info", function() {
          u.log("Info requested");
          Server.prototype.broadcast("r_info", global.db_info_text);
        });

        //MESSAGES
        socket.on("newmsg_a", function(msg) {
          u.log("New message recieved: " + msg);
          Server.prototype.broadcast("msg_fromweb_a", msg);
        });
        socket.on("newmsg_o", function(msg) {
          u.log("New message recieved (for organizers): " + msg);
          Server.prototype.broadcast("msg_fromweb_o", msg);
        });
        socket.on("newmsg_u", function(msg) {
          u.log("New message recieved (for users): " + msg);
          Server.prototype.broadcast("msg_fromweb_u", msg);
        });

        //ACHIEVEMENTS
        socket.on("newach", function(msg) {
          db.setdb("achievements", u.str_to_dbarr(msg), function() {});
          Server.prototype.broadcast("newach_fromweb", msg);
          u.log("New achievement recieved: \n" + msg);
        });

        socket.on("req_ach", function() {
          u.log("Ach requested");
          Server.prototype.broadcast("r_ach", u.dbarr_to_str(global.db_achiev_arr));
        });
      }
    });
  }

  updatedb() {
    db.getdb_c("info", function(err, data) {
      assert.equal(err, null);
      global.db_info_text = data;
      db.getdb_c("timetable", function(err, data1) {
        assert.equal(err, null);
        global.db_plan_text = data1;
        db.getdb_c("achievements", function(err, data2) {
          assert.equal(err, null);
          global.db_achiev_arr = data2;

          if (!global.ok) {
            Server.prototype.start_srv();
          }
          global.ok = true;
        });
      });
    });
  }

  broadcast(event, data) {
    sockets.forEach(function(socket) {
      socket.emit(event, data);
    });
  }
}

module.exports.Server = Server;
