'use strict';

let _bot = null;

module.exports = function (bot) {
    _bot = bot;
    bot.onText(/^\/start$/, onHelpStart);
    bot.onText(/^\/help$/, onHelpStart);
    bot.on('new_chat_participant', onNewChatParticipant);
};


function onHelpStart(msg) {
    if (msg.from.id === msg.chat.id) {
        return sendHelpForPrivate(msg);
    };
    return sendHelpForGroup(msg);
};

function onNewChatParticipant(msg) {
    //TO DO
};


function sendHelpForPrivate(msg) {
    let menu = {
        '/play': 'Начать игру',
        '/top': 'Общий рейтинг игроков'
    };
    return _bot.sendMessage(msg.chat.id, 'Привет, я умею понимать следующие команды:\n' + formatMenu(menu));
};

function sendHelpForGroup(msg) {
    //TO DO
    return _bot.sendMessage(msg.chat.id, 'Привет, я умею понимать следующие команды:\n GROUP');
};


function formatMenu(menu) {
    return Object.keys(menu).map(key => {
        return key + ' - ' + menu[key];
    }).join('\n');
};