'use strict';

var assert = require("assert");
var mongo = require("mongodb").MongoClient;
var u = require("./util.js");
var url = "";

class db_worker {
    constructor(_url) {
        url = _url;
    }

    getdb_c(col, callback) {
        mongo.connect(url, function(err, db) {
            assert.equal(err, null, "Not connected to db");
            db_worker.prototype.getdb(db, col, callback);
        });
    }

    getdb(db, col, callback) {
        var collection = db.collection(col);
        collection.find({
            "main": true
        }).toArray(function(err, docs) {
            assert.equal(err, null);

            callback(err, docs[0].body);
            db.close();
        });
    }

    setdb(col, data, callback) {
        mongo.connect(url, function(err, db) {
            assert.equal(err, null, "Not connected to db");

            var collection = db.collection(col);
            if (col === "users") {
                db_worker.prototype.getdb(db, col, function(data1) {
                    var pre1 = u.unique(data1.users.concat(data[0]));
                    var pre2 = u.unique(data1.superusers.concat(data[1]));

                    collection.updateOne({
                            "main": true
                        }, {
                            $set: {
                                "body": {
                                    "users": pre1,
                                    "superusers": pre2,
                                    "password": (data[2] || data1.password)
                                }
                            }
                        },
                        function(err, result) {
                            assert.equal(err, null);
                            assert.equal(1, result.result.n);
                            callback();
                            db.close();
                        });
                });
            }
            else if (col !== "achievements") {
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
                        db.close();
                    });
            }
            else {
                db_worker.prototype.getdb(db, col, function(data1) {
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
                            db.close();
                        });
                });
            }
        });
    }
}

module.exports.db_worker = db_worker;
module.exports.mongo = mongo;
