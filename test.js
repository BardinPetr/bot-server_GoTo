'use strict';

var db = require("./db_worker.js").db_worker;
db = new db("mongodb://localhost:27017/goto_bot");

var u = require("./util.js");

db.setdb("users", [
        [12344],
        [],
        'qwerty1'
    ],
    function() {
        db.getdb_c("users", function(body) {
            console.log(body);
        });
    });

db.setdb("timetable", u.str_to_dbarr("test: test1"),
    function() {
        db.getdb_c("timetable", function(body) {
            console.log(body);
        });
    });

db.setdb("achievements", u.str_to_dbarr("test: test1"),
    function() {
        db.getdb_c("achievements", function(body) {
            console.log(body);
        });
    });

db.setdb("info", "test info",
    function() {
        db.getdb_c("info", function(body) {
            console.log(body);
        });
    });
