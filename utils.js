'use strict';

exports.sendHelpForPrivate = function (bot, msg) {
    let menu = {
        '/play': 'Начать игру',
        '/groups': 'Настроить меня для твоих групп',
        '/top': 'Общий рейтинг игроков'
    };
    return bot.sendMessage(msg.chat.id, 'Привет, я умею понимать следующие команды:\n' + formatMenu(menu));
};

exports.sendHelpForGroup = function (bot, msg) {
    let menu = {
        '/top': 'Рейтинг игроков в чате'
    };

    return bot.sendMessage(msg.chat.id, 'Привет, я умею понимать следующие команды:\n' + formatMenu(menu));
};

function formatMenu(menu) {
    return Object.keys(menu).map(key => {
        return key + ' - ' + menu[key];
    }).join('\n');
};

