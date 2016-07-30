'use strict';

const Utils = require('../utils');
let _bot = null;

module.exports = function (bot) {
    _bot = bot;
    bot.onText(/^\/start$/, onHelpStart);
    bot.onText(/^\/help$/, onHelpStart);

};


function onHelpStart(msg) {
    if (msg.from.id === msg.chat.id) {
        return Utils.sendHelpForPrivate(_bot, msg);
    };
    return Utils.sendHelpForGroup(_bot, msg);
};




