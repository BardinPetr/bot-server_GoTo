const DEBUG = true;

var TelegramBot = require("node-telegram-bot-api");

const token = "377701943:AAHl_K9HbWI90-CUxqs--mkpp64vU7Ypn3k";
var bot = new TelegramBot(token, {
    polling: true
});

var moment = require("moment");
var mongo = require("mongodb").MongoClient,
    assert = require("assert");
var url = "mongodb://localhost:27017/goto_bot";

var socket = require("socket.io-client")("http://localhost:" + process.env.PORT);

global.db_plan = [
    []
];
global.db_info = "NO INFO";
global.db_achiev = [
    []
];
global.db_users = [];
global.db_superusers = [];
global.pswd = "pswd";
global.run = false;
global.rawinput_state = 0;
global.cmds = ["start", "сообщения", "Написать участикам", "Написать организанорам", "Я студент", "Я организатор", "Мой пароль:", "расписание", "Просмотреть расписание", "Изменить расписание", "информация", "достижения"];
global.sendto = false;
global.dbConnectionsCount = 0;
global.dbOk = false;

var lasttime = "";

function broadcast_f(func) {
    log("Starting broadcast func sending...");
    var arr = global.db_users.concat(global.db_superusers);
    for (var i = 0; i < arr.length; i++) {
        var id = arr[i];
        if (id) {
            log("Sending data to " + id);
            func(id);
        }
    }
    log("Sending finished");
}

function broadcast_t(type, text) {
    log("Starting broadcast sending message...");
    var arr = (type === false ? global.db_users : global.db_superusers);
    for (var i = 0; i < arr.length; i++) {
        var id = arr[i];
        if (id) {
            log("Sending data to " + id);
            bot.sendMessage(id, text);
        }
    }
    log("Sending finished");
}

function broadcast_a(text) {
    broadcast_t(false, text);
    broadcast_t(true, text);
}

function unique(data) {
    data = data.sort();
    var a = data[0],
        k = 1;

    for (var i = 1; i < data.length; i++) {
        if (data[i] !== a) {
            data[k] = data[i];
            a = data[i];
            k++;
        }
    }
    data.length = k;
    return data;
}

function ncmd(text) {
    for (var i = 0; i < global.cmds.length; i++) {
        var x = global.cmds[i];
        if (text.indexOf(x) !== -1) {
            return 0;
        }
    }
    return 1;
}

function log(data) {
    if (DEBUG) {
        console.log(data);
    }
}

function dbarr_to_str(data) {
    var out = [];
    try {
        for (var i = 0; i < data.length; i++) {
            out[i] = data[i].join(": ");
        }
        return out.join("\n");
    }
    catch (E) {

    }
    return "";
}

function str_to_dbarr(data, del) {
    try {
        var prearr = data.split(del);
        for (var i = 0; i < prearr.length; i++) {
            prearr[i] = prearr[i].split(": ");
        }
        return prearr;
    }
    catch (E) {

    }
    return [];
}

function update5() {
    var tNow = moment().utc().utcOffset("+03:00").format("HH.mm");
    var t15AfterNow = moment().utc().utcOffset("+03:15").format("HH.mm");
    var select = "";

    if (tNow === "07.00") {
        broadcast_a("Доброе утро!");
        broadcast_t(false, "Вот расписание на сегодня:\n" + dbarr_to_str(global.db_plan));
    }

    for (var i = 0; i < global.db_plan.length; i++) {
        if (global.db_plan[i][0] === tNow && lasttime !== tNow) {
            select = global.db_plan[i][1];
            lasttime = tNow;
            broadcast_t(false, "Внимание! Уже сейчас: " + select);
        }
        else if (global.db_plan[i][0] === t15AfterNow && lasttime !== t15AfterNow) {
            select = global.db_plan[i][1];
            lasttime = t15AfterNow;
            broadcast_t(false, "Внимание: через 15 минут: " + select);
        }
    }
}

function updatedb() {
    if (!global.run) {
        log("Reading DB...");
    }

    mongo.connect(url, function(err, db) {
        if (err) {
            if (!global.run) {
                log("Not connected to db!\nTrying to reconnect");
            }
            if (global.dbConnectionsCount === 2) {
                assert(false, "Bot can't connect to db!");
            }
            global.run = true;
            global.dbConnectionsCount++;
            updatedb();
        }
        else {
            global.dbOk = true;
        }
        getdb(db, "info", function() {
            getdb(db, "timetable", function() {
                getdb(db, "achievements", function() {
                    getdb(db, "users", function() {
                        db.close();
                        if (!global.run) {
                            start();
                            log("DB read successfull\nBot started\n");
                        }
                        global.run = true;
                        global.dbOk = true;

                        updatedb(); //Recursion
                    });
                });
            });
        });
    });
}

function getdb(db, col, callback) {
    if (global.dbOk) {
        var collection = db.collection(col);
        collection.find({
            "main": true
        }).toArray(function(err, docs) {
            if (err) {
                log("Get data from DB is failed!");
            }
            switch (col) {
                case "info":
                    global.db_info = docs[0].body;
                    break;
                case "timetable":
                    global.db_plan = docs[0].body;
                    break;
                case "achievements":
                    global.db_achiev = docs[0].body;
                    break;
                case "users":
                    global.db_users = docs[0].body.users;
                    global.db_superusers = docs[0].body.superusers;
                    global.pswd = docs[0].body.password;
                    break;
            }
            callback(docs[0].body);
        });
    }
}

function setdb(col, data, callback) {
    if (global.dbOk) {
        mongo.connect(url, function(err, db) {
            if (err) {
                log("Get data from DB is failed!");
            }
            var collection = db.collection(col);
            if (col === "users") {
                getdb(db, "users", function(data1) {
                    var pre1 = unique(data1.users.concat(data[0]));
                    var pre2 = unique(data1.superusers.concat(data[1]));

                    collection.updateOne({
                            "main": true
                        }, {
                            $set: {
                                "body": {
                                    "users": pre1,
                                    "superusers": pre2,
                                    "password": (data[3] || data1.password)
                                }
                            }
                        },
                        function(err, result) {
                            assert.equal(err, null);
                            assert.equal(1, result.result.n);
                            callback();
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
}

//USERS
var onstart = function(msg, match) {
    resetRawInput();
    var id = msg.chat.id;
    bot.sendMessage(id, "Привет!");

    const opts = {
        reply_markup: JSON.stringify({
            keyboard: [
                ["Я студент"],
                ["Я организатор"]
            ],
            one_time_keyboard: true
        })
    };
    bot.sendMessage(msg.chat.id, "Ты студент или организатор(преподаватель)?", opts);
};

var onstudent = function(msg, match) {
    resetRawInput();
    var id = msg.chat.id;
    bot.sendMessage(id, "Привет, " + msg.from.first_name + "! Теперь ты в системе!");
    setdb("users", [
        [id],
        []
    ], function() {});

    sendMainMenu(id);
    return;
};

var onorganizer = function(msg, match) {
    var id = msg.chat.id;
    bot.sendMessage(id, "Хорошо, но вам нужно подтвердить должность организатора паролем! Напишате мне его");
    setRawInput(2); //Следующий чистый вход - пароль
};

//TIMETABLE
var ontimetable = function(msg, match) {
    resetRawInput();
    var id = msg.chat.id;

    bot.sendMessage(id, "Хорошо. Приступим.");

    const opts = {
        reply_markup: JSON.stringify({
            keyboard: [
                ["Просмотреть расписание"],
                ["Изменить расписание"]
            ],
            one_time_keyboard: true
        })
    };
    bot.sendMessage(msg.chat.id, "Что вы хотите сделать?", opts);
};

var onsendtt = function(msg, match) {
    resetRawInput();
    var id = msg.chat.id;
    var x = "Вот расписание:\n" + dbarr_to_str(global.db_plan);
    bot.sendMessage(id, x);
    sendMainMenu(id);
};

var onnewtt = function(msg, match) {
    var id = msg.chat.id;
    log(global.db_superusers);
    if (global.db_superusers.indexOf(id) > -1) {
        bot.sendMessage(id, "Теперь введите новое расписание.\nКаждый элемент должен находиться на отдельной строке(shift+enter).\nКаждый элемент: \"{время в формате чч.мм}: {название мероприятия}\"\nНапример:\n11.20: обед\n11.80: прогулка");
        setRawInput(1); //Следующий чистый вход - расписание
    }
    else {
        bot.sendMessage(id, "Ученикам нельзя редактировать расписание!");
    }
};

//INFO
var oninfo = function(msg, match) {
    resetRawInput();
    var id = msg.chat.id;
    bot.sendMessage(id, "Хорошо. Приступим.");

    const opts = {
        reply_markup: JSON.stringify({
            keyboard: [
                ["Просмотреть информацию"],
                ["Изменить информацию"]
            ],
            one_time_keyboard: true
        })
    };
    bot.sendMessage(msg.chat.id, "Что вы хотите сделать?", opts);
};

var onsendinfo = function(msg, match) {
    resetRawInput();
    var id = msg.chat.id;
    var x = "Вот информация:\n" + global.db_info;
    bot.sendMessage(id, x);
    sendMainMenu(id);
};

var onnewinfo = function(msg, match) {
    var id = msg.chat.id;
    if (global.db_superusers.indexOf(id) > -1) {
        bot.sendMessage(id, "Теперь введите новую информацию.");
        setRawInput(3); //Следующий чистый вход - информация
    }
    else {
        bot.sendMessage(id, "Ученикам нельзя редактировать информацию!");
    }
};

//ACHIEVEMENTS
var onach = function(msg, match) {
    resetRawInput();
    var id = msg.chat.id;

    bot.sendMessage(id, "Хорошо. Приступим.");

    const opts = {
        reply_markup: JSON.stringify({
            keyboard: [
                ["Просмотреть достижения"],
                ["Добавить достижение"]
            ],
            one_time_keyboard: true
        })
    };
    bot.sendMessage(msg.chat.id, "Что вы хотите сделать?", opts);
};

var onsendach = function(msg, match) {
    resetRawInput();
    var id = msg.chat.id;
    var x = "Вот достижения:\n" + dbarr_to_str(global.db_achiev);
    bot.sendMessage(id, x);
    sendMainMenu(id);
};

var onnewach = function(msg, match) {
    var id = msg.chat.id;
    if (global.db_superusers.indexOf(id) > -1) {
        bot.sendMessage(id, "Теперь введите новое достижение в формате: \"{человек}: {достижение}\"");
        setRawInput(4); //Следующий чистый вход - достижение
    }
    else
        bot.sendMessage(id, "Ученикам нельзя редактировать расписание!");
};


//MESSAGES
var onmsg = function(msg, match) {
    resetRawInput();
    var id = msg.chat.id;

    bot.sendMessage(id, "Хорошо.");

    const opts = {
        reply_markup: JSON.stringify({
            keyboard: [
                ["Написать участикам"],
                ["Написать организанорам"]
            ],
            one_time_keyboard: true
        })
    };
    bot.sendMessage(msg.chat.id, "Кому вы хотите написать?", opts);
};

var onorgmsg = function(msg, match) {
    var id = msg.chat.id;
    if (global.db_superusers.indexOf(id) > -1) {
        global.sendto = true;
        setRawInput(5);
        bot.sendMessage(id, "ОК. Введите сообщение.");
    }
    else {
        bot.sendMessage(id, "Участникам нельзя использовать эту функцию");
    }
};

var onusermsg = function(msg, match) {
    var id = msg.chat.id;
    global.sendto = false;
    setRawInput(5);
    bot.sendMessage(id, "ОК. Введите сообщение.");
};

function resetRawInput() {
    setRawInput(0);
}

function setRawInput(v) {
    global.rawinput_state = v;
}

//RAW INPUT HANDLING
function onrawinput(msg, match) {
    var id = msg.chat.id;
    if (!ncmd(match[0])) {
        return;
    }
    switch (global.rawinput_state) {
        case 1:
            var x = str_to_dbarr(msg.text);
            setdb("timetable", x, function() {
                bot.sendMessage(id, "ОК. Новое расписание сохранено!");
                broadcast_t(false, "Внимание: новое расписание: \n" + msg.text);
                sendMainMenu(id);
            });
            break;
        case 2:
            var res = match[1];
            if (res === global.pswd) {
                bot.sendMessage(id, "Здравствуй, " + msg.from.first_name + "! Очень хорошо! Теперь вы в системе!");
                setdb("users", [
                    [],
                    [id]
                ], function() {
                    sendMainMenu(id);
                });
            }
            else {
                bot.sendMessage(id, "Так, так! Кто-то пытается притвориться организатором?!");
            }
            break;
        case 3:
            var d = msg.text;
            setdb("info", d, function() {
                bot.sendMessage(id, "Новая информация записана\n");
                broadcast_t(false, "Внимание: новая информация: \n" + d);
                sendMainMenu(id);
            });
            break;
        case 4:
            var x = str_to_dbarr(msg.text);
            setdb("achievements", x, function() {
                bot.sendMessage(id, "ОК. Новое достижение добавлено!");
                broadcast_t(false, "Новое достижение: \n" + msg.text);
                sendMainMenu(id);
            });
            break;
        case 5:
            var text = msg.text + "\nОтправитель: @" + msg.from.username;
            broadcast_t(global.sendto, text);
            sendMainMenu(id);
            break;
        default:
            return;
    }
    resetRawInput();
}


function sendMainMenu(id) {
    const opts = {
        reply_markup: JSON.stringify({
            keyboard: [
                ["\/timetable - расписание"],
                ["\/information - информация"],
                ["\/achievements - достижения"],
                ["\/messaging - сообщения"]
            ],
            one_time_keyboard: true
        })
    };
    bot.sendMessage(id, "\n\nЧто вы хотите сделать?", opts);
}

function start() {
    setInterval(update5, 5000);

    bot.onText(/(.+)/, onrawinput);

    bot.onText(/\/start/, onstart);
    bot.onText(/Я студент/, onstudent);
    bot.onText(/Я организатор/, onorganizer);

    bot.onText(/\/timetable/, ontimetable);
    bot.onText(/Просмотреть расписание/, onsendtt);
    bot.onText(/Изменить расписание/, onnewtt);

    bot.onText(/\/information/, oninfo);
    bot.onText(/Просмотреть информацию/, onsendinfo);
    bot.onText(/Изменить информацию/, onnewinfo);

    bot.onText(/\/achievements/, onach);
    bot.onText(/Просмотреть достижения/, onsendach);
    bot.onText(/Добавить достижение/, onnewach);

    bot.onText(/\/messaging/, onmsg);
    bot.onText(/Написать участикам/, onusermsg);
    bot.onText(/Написать организанорам/, onorgmsg);

    broadcast_f(sendMainMenu);

    socket.on("msg_fromweb_a", function(data) {
        broadcast_a(data + "\nОтправитель: WEB-интерфейс");
    });
    socket.on("msg_fromweb_o", function(data) {
        broadcast_t(true, data + "\nОтправитель: WEB-интерфейс");
    });
    socket.on("msg_fromweb_u", function(data) {
        broadcast_t(false, data + "\nОтправитель: WEB-интерфейс");
    });
}


//START
updatedb(); //This will get DB and when first data pack processed, it will run start()
