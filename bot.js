'use strict';

const DEBUG = true;

var TelegramBot = require("node-telegram-bot-api");

const token = "377701943:AAHl_K9HbWI90-CUxqs--mkpp64vU7Ypn3k";
var bot = new TelegramBot(token, {
    polling: true
});

var moment = require("moment");
var assert = require("assert");

var socket = require("socket.io-client")("http://localhost:" + process.env.PORT);

var u = require("./util.js");

var db = require("./db_worker.js").db_worker;
db = new db("mongodb://localhost:27017/goto_bot");

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
    u.log("Starting broadcast func sending...");
    var arr = global.db_users.concat(global.db_superusers);
    for (var i = 0; i < arr.length; i++) {
        var id = arr[i];
        if (id) {
            u.log("Sending data to " + id);
            func(id);
        }
    }
    u.log("Sending finished");
}

function broadcast_t(type, text) {
    u.log("Starting broadcast sending message...");
    var arr = (type === false ? global.db_users : global.db_superusers);
    for (var i = 0; i < arr.length; i++) {
        var id = arr[i];
        if (id) {
            u.log("Sending data to " + id);
            bot.sendMessage(id, text);
        }
    }
    u.log("Sending finished");
}

function broadcast_a(text) {
    broadcast_t(false, text);
    broadcast_t(true, text);
}

function update5() {
    var tNow = moment().utc().utcOffset("+03:00").format("HH.mm");
    var t15AfterNow = moment().utc().utcOffset("+03:15").format("HH.mm");
    var select = "";

    if (tNow === "07.00") {
        broadcast_a("Доброе утро!");
        broadcast_t(false, "Вот расписание на сегодня:\n" + u.dbarr_to_str(global.db_plan));
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
        u.log("Reading DB...");
    }

    db.getdb_c("info", function(data) {
        global.db_info = data;
        db.getdb_c("timetable", function(data1) {
            global.db_plan = data1;
            db.getdb_c("achievements", function(data2) {
                global.db_achiev = data2;
                db.getdb_c("users", function(data3) {
                    global.db_users = data3.users;
                    global.db_superusers = data3.superusers;
                    global.pswd = data3.password;
                    if (!global.run) {
                        start();
                        u.log("DB read successfull\nBot started\n");
                    }
                    global.run = true;
                    global.dbOk = true;

                    updatedb(); //Recursion
                });
            });
        });
    });
}


//USERS
var onstart = function(msg) {
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

var onstudent = function(msg) {
    resetRawInput();
    var id = msg.chat.id;
    bot.sendMessage(id, "Привет, " + msg.from.first_name + "! Теперь ты в системе!");
    db.setdb("users", [
        [id],
        []
    ], function() {});

    sendMainMenu(id);
    return;
};

var onorganizer = function(msg) {
    var id = msg.chat.id;
    bot.sendMessage(id, "Хорошо, но вам нужно подтвердить должность организатора паролем! Напишате мне его");
    setRawInput(2); //Следующий чистый вход - пароль
};

//TIMETABLE
var ontimetable = function(msg) {
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

var onsendtt = function(msg) {
    resetRawInput();
    var id = msg.chat.id;
    var x = "Вот расписание:\n" + u.dbarr_to_str(global.db_plan);
    bot.sendMessage(id, x);
    sendMainMenu(id);
};

var onnewtt = function(msg) {
    var id = msg.chat.id;
    u.log(global.db_superusers);
    if (global.db_superusers.indexOf(id) > -1) {
        bot.sendMessage(id, "Теперь введите новое расписание.\nКаждый элемент должен находиться на отдельной строке(shift+enter).\nКаждый элемент: \"{время в формате чч.мм}: {название мероприятия}\"\nНапример:\n11.20: обед\n11.80: прогулка");
        setRawInput(1); //Следующий чистый вход - расписание
    }
    else {
        bot.sendMessage(id, "Ученикам нельзя редактировать расписание!");
    }
};

//INFO
var oninfo = function(msg) {
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

var onsendinfo = function(msg) {
    resetRawInput();
    var id = msg.chat.id;
    var x = "Вот информация:\n" + global.db_info;
    bot.sendMessage(id, x);
    sendMainMenu(id);
};

var onnewinfo = function(msg) {
    var id = msg.chat.id;
    u.log(global.db_superusers);
    if (global.db_superusers.indexOf(id) > -1) {
        bot.sendMessage(id, "Теперь введите новую информацию.");
        setRawInput(3); //Следующий чистый вход - информация
    }
    else {
        bot.sendMessage(id, "Ученикам нельзя редактировать информацию!");
    }
};

//ACHIEVEMENTS
var onach = function(msg) {
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

var onsendach = function(msg) {
    resetRawInput();
    var id = msg.chat.id;
    var x = "Вот достижения:\n" + u.dbarr_to_str(global.db_achiev);
    bot.sendMessage(id, x);
    sendMainMenu(id);
};

var onnewach = function(msg) {
    var id = msg.chat.id;
    if (global.db_superusers.indexOf(id) > -1) {
        bot.sendMessage(id, "Теперь введите новое достижение в формате: \"{человек}: {достижение}\"");
        setRawInput(4); //Следующий чистый вход - достижение
    }
    else {
        bot.sendMessage(id, "Ученикам нельзя редактировать расписание!");
    }
};


//MESSAGES
var onmsg = function(msg) {
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

var onorgmsg = function(msg) {
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

var onusermsg = function(msg) {
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

    if (!u.ncmd(match[0], global.cmds)) {
        return;
    }

    switch (global.rawinput_state) {
        case 1:
            var x = u.str_to_dbarr(msg.text);
            db.setdb("timetable", x, function() {
                bot.sendMessage(id, "ОК. Новое расписание сохранено!");
                broadcast_t(false, "Внимание: новое расписание: \n" + msg.text);
                sendMainMenu(id);
            });
            break;
        case 2:
            var res = match[1];
            if (res === global.pswd) {
                bot.sendMessage(id, "Здравствуй, " + msg.from.first_name + "! Очень хорошо! Теперь вы в системе!");
                db.setdb("users", [
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
            db.setdb("info", d, function() {
                bot.sendMessage(id, "Новая информация записана\n");
                broadcast_t(false, "Внимание: новая информация: \n" + d);
                sendMainMenu(id);
            });
            break;
        case 4:
            var x = u.str_to_dbarr(msg.text);
            db.setdb("achievements", x, function() {
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
