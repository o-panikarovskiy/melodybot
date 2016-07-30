'use strict';
let _bot = null;

module.exports = function (bot) {
    _bot = bot;
    bot.onText(/^\/play$/, onPlay);
};

function onPlay(msg) {
    //TO DO
    _bot.sendMessage(msg.chat.id, 'GAME GO!');
};