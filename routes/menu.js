'use strict';
let _bot = null;

module.exports = function (bot) {
    _bot = bot;
    bot.onText(/^\/start$/, onHelpStart);
    bot.onText(/^\/help$/, onHelpStart);
   
};


function onHelpStart(msg) {
    if (msg.from.id === msg.chat.id) {
        return sendHelpForPrivate(msg);
    };
    return sendHelpForGroup(msg);
};


function sendHelpForPrivate(msg) {
    let menu = {
        '/play': 'Начать игру',
        '/groups': 'Настроить меня для твоих групп',
        '/top': 'Общий рейтинг игроков'
    };
    return _bot.sendMessage(msg.chat.id, 'Привет, я умею понимать следующие команды:\n' + formatMenu(menu));
};

function sendHelpForGroup(msg) {
    let menu = {
        '/top': 'Рейтинг игроков в чате'
    };

    return _bot.sendMessage(msg.chat.id, 'Привет, я умею понимать следующие команды:\n' + formatMenu(menu));
};

function formatMenu(menu) {
    return Object.keys(menu).map(key => {
        return key + ' - ' + menu[key];
    }).join('\n');
};

