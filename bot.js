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

class Bot {
    constructor(db_addr) {
        db = new db(db_addr || "mongodb://localhost:27017/goto_bot");
    }

    start() {
        Bot.prototype.updatedb();
    }

    broadcast_f(func) {
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

    broadcast_t(type, text) {
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

    broadcast_a(text) {
        Bot.prototype.broadcast_t(false, text);
        Bot.prototype.broadcast_t(true, text);
    }

    update5() {
        var tNow = moment().utc().utcOffset("+03:00").format("HH.mm");
        var t15AfterNow = moment().utc().utcOffset("+03:15").format("HH.mm");
        var select = "";

        if (tNow === "07.00") {
            Bot.prototype.broadcast_a("Доброе утро!");
            Bot.prototype.broadcast_t(false, "Вот расписание на сегодня:\n" + u.dbarr_to_str(global.db_plan));
        }

        for (var i = 0; i < global.db_plan.length; i++) {
            if (global.db_plan[i][0] === tNow && lasttime !== tNow) {
                select = global.db_plan[i][1];
                lasttime = tNow;
                Bot.prototype.broadcast_t(false, "Внимание! Уже сейчас: " + select);
            }
            else if (global.db_plan[i][0] === t15AfterNow && lasttime !== t15AfterNow) {
                select = global.db_plan[i][1];
                lasttime = t15AfterNow;
                Bot.prototype.broadcast_t(false, "Внимание: через 15 минут: " + select);
            }
        }
    }

    updatedb() {
        if (!global.run) {
            u.log("Reading DB...");
        }

        db.getdb_c("info", function(err, data) {
            assert.equal(err, null);
            global.db_info = data;
            db.getdb_c("timetable", function(err, data1) {
                assert.equal(err, null);
                global.db_plan = data1;
                db.getdb_c("achievements", function(err, data2) {
                    assert.equal(err, null);
                    global.db_achiev = data2;
                    db.getdb_c("users", function(err, data3) {
                        assert.equal(err, null);
                        global.db_users = data3.users;
                        global.db_superusers = data3.superusers;
                        global.pswd = data3.password;
                        if (!global.run) {
                            Bot.prototype.start_bot();
                            u.log("DB read successfull\nBot started\n");
                        }
                        global.run = true;
                        global.dbOk = true;
                    });
                });
            });
        });
    }


    //USERS
    onstart(msg) {
        Bot.prototype.resetRawInput();
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
    }

    onstudent(msg) {
        Bot.prototype.resetRawInput();
        var id = msg.chat.id;
        bot.sendMessage(id, "Привет, " + msg.from.first_name + "! Теперь ты в системе!");
        db.setdb("users", [
            [msg.chat.username],
            []
        ], function() {
            Bot.prototype.sendMainMenu(id);
        });
        return;
    }

    onorganizer(msg) {
        var id = msg.chat.id;
        bot.sendMessage(id, "Хорошо, но вам нужно подтвердить должность организатора паролем! Напишате мне его");
        Bot.prototype.setRawInput(2); //Следующий чистый вход - пароль
    }

    //TIMETABLE
    ontimetable(msg) {
        Bot.prototype.resetRawInput();
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
    }

    onsendtt(msg) {
        Bot.prototype.resetRawInput();
        var id = msg.chat.id;
        var x = "Вот расписание:\n" + u.dbarr_to_str(global.db_plan);
        bot.sendMessage(id, x);
        Bot.prototype.sendMainMenu(id);
    }

    onnewtt(msg) {
        var id = msg.chat.id;
        u.log(global.db_superusers);
        if (global.db_superusers.indexOf(id) > -1) {
            bot.sendMessage(id, "Теперь введите новое расписание.\nКаждый элемент должен находиться на отдельной строке(shift+enter).\nКаждый элемент: \"{время в формате чч.мм}: {название мероприятия}\"\nНапример:\n11.20: обед\n11.80: прогулка");
            Bot.prototype.setRawInput(1); //Следующий чистый вход - расписание
        }
        else {
            bot.sendMessage(id, "Ученикам нельзя редактировать расписание!");
        }
    }

    //INFO
    oninfo(msg) {
        Bot.prototype.resetRawInput();
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
    }

    onsendinfo(msg) {
        Bot.prototype.resetRawInput();
        var id = msg.chat.id;
        var x = "Вот информация:\n" + global.db_info;
        bot.sendMessage(id, x);
        Bot.prototype.sendMainMenu(id);
    }

    onnewinfo(msg) {
        var id = msg.chat.id;
        u.log(global.db_superusers);
        if (global.db_superusers.indexOf(id) > -1) {
            bot.sendMessage(id, "Теперь введите новую информацию.");
            Bot.prototype.setRawInput(3); //Следующий чистый вход - информация
        }
        else {
            bot.sendMessage(id, "Ученикам нельзя редактировать информацию!");
        }
    }

    //ACHIEVEMENTS
    onach(msg) {
        Bot.prototype.resetRawInput();
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
    }

    onsendach(msg) {
        Bot.prototype.resetRawInput();
        var id = msg.chat.id;
        var x = "Вот достижения:\n" + u.dbarr_to_str(global.db_achiev);
        bot.sendMessage(id, x);
        Bot.prototype.sendMainMenu(id);
    }

    onnewach(msg) {
        var id = msg.chat.id;
        if (global.db_superusers.indexOf(id) > -1) {
            bot.sendMessage(id, "Теперь введите новое достижение в формате: \"{человек}: {достижение}\"");
            Bot.prototype.setRawInput(4); //Следующий чистый вход - достижение
        }
        else {
            bot.sendMessage(id, "Ученикам нельзя редактировать расписание!");
        }
    }


    //MESSAGES
    onmsg(msg) {
        Bot.prototype.resetRawInput();
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
    }

    onorgmsg(msg) {
        var id = msg.chat.id;
        if (global.db_superusers.indexOf(id) > -1) {
            global.sendto = true;
            Bot.prototype.setRawInput(5);
            bot.sendMessage(id, "ОК. Введите сообщение.");
        }
        else {
            bot.sendMessage(id, "Участникам нельзя использовать эту функцию");
        }
    }

    onusermsg(msg) {
        var id = msg.chat.id;
        global.sendto = false;
        Bot.prototype.setRawInput(5);
        bot.sendMessage(id, "ОК. Введите сообщение.");
    }

    resetRawInput() {
        Bot.prototype.setRawInput(0);
    }

    setRawInput(v) {
        global.rawinput_state = v;
    }

    //RAW INPUT HANDLING
    onrawinput(msg, match) {
        var id = msg.chat.id;

        if (!u.ncmd(match[0], global.cmds)) {
            return;
        }

        switch (global.rawinput_state) {
            case 1:
                var x = u.str_to_dbarr(msg.text);
                db.setdb("timetable", x, function() {
                    bot.sendMessage(id, "ОК. Новое расписание сохранено!");
                    Bot.prototype.broadcast_t(false, "Внимание: новое расписание: \n" + msg.text);
                    Bot.prototype.sendMainMenu(id);
                });
                break;
            case 2:
                var res = match[1];
                if (res === global.pswd) {
                    bot.sendMessage(id, "Здравствуй, " + msg.from.first_name + "! Очень хорошо! Теперь вы в системе!");
                    db.setdb("users", [
                        [],
                        [msg.chat.username]
                    ], function() {
                        Bot.prototype.sendMainMenu(id);
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
                    Bot.prototype.broadcast_t(false, "Внимание: новая информация: \n" + d);
                    Bot.prototype.sendMainMenu(id);
                });
                break;
            case 4:
                var x = u.str_to_dbarr(msg.text);
                db.setdb("achievements", x, function() {
                    bot.sendMessage(id, "ОК. Новое достижение добавлено!");
                    Bot.prototype.broadcast_t(false, "Новое достижение: \n" + msg.text);
                    Bot.prototype.sendMainMenu(id);
                });
                break;
            case 5:
                var text = msg.text + "\nОтправитель: @" + msg.from.username;
                Bot.prototype.broadcast_t(global.sendto, text);
                Bot.prototype.sendMainMenu(id);
                break;
            default:
                return;
        }
        Bot.prototype.resetRawInput();
    }


    sendMainMenu(id) {
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

    start_bot() {
        setInterval(Bot.prototype.update5, 5000);
        setInterval(Bot.prototype.updatedb, 10000);

        bot.onText(/(.+)/, Bot.prototype.onrawinput);

        bot.onText(/\/start/, Bot.prototype.onstart);
        bot.onText(/Я студент/, Bot.prototype.onstudent);
        bot.onText(/Я организатор/, Bot.prototype.onorganizer);

        bot.onText(/\/timetable/, Bot.prototype.ontimetable);
        bot.onText(/Просмотреть расписание/, Bot.prototype.onsendtt);
        bot.onText(/Изменить расписание/, Bot.prototype.onnewtt);

        bot.onText(/\/information/, Bot.prototype.oninfo);
        bot.onText(/Просмотреть информацию/, Bot.prototype.onsendinfo);
        bot.onText(/Изменить информацию/, Bot.prototype.onnewinfo);

        bot.onText(/\/achievements/, Bot.prototype.onach);
        bot.onText(/Просмотреть достижения/, Bot.prototype.onsendach);
        bot.onText(/Добавить достижение/, Bot.prototype.onnewach);

        bot.onText(/\/messaging/, Bot.prototype.onmsg);
        bot.onText(/Написать участикам/, Bot.prototype.onusermsg);
        bot.onText(/Написать организанорам/, Bot.prototype.onorgmsg);

        Bot.prototype.broadcast_f(Bot.prototype.sendMainMenu);

        socket.on("msg_fromweb_a", function(data) {
            Bot.prototype.broadcast_a(data + "\nОтправитель: WEB-интерфейс");
        });
        socket.on("msg_fromweb_o", function(data) {
            Bot.prototype.broadcast_t(true, data + "\nОтправитель: WEB-интерфейс");
        });
        socket.on("msg_fromweb_u", function(data) {
            Bot.prototype.broadcast_t(false, data + "\nОтправитель: WEB-интерфейс");
        });
    }
}

module.exports.Bot = Bot;
