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
    //TO DO:
    return _bot.sendMessage(msg.chat.id, 'Привет, я умею понимать следующие команды:\n PRIVATE');
};

function sendHelpForGroup(msg) {
    //TO DO
    return _bot.sendMessage(msg.chat.id, 'Привет, я умею понимать следующие команды:\n GROUP');
};