'use strict';

exports.sendHelpForPrivate = function (bot, msg) {
    let menu = {
        '/play': 'Начать игру',
        '/groups': 'Настроить мои группы',
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

exports.formatWinnerRow = function (player, position, score) {
    let name = player.first_name ? (player.first_name + (player.last_name ? ' ' + player.last_name : '')) : '';
    name = player.username ? '@' + player.username : (name ? name : 'Nobody');
    return `${position + 1}. ${name}: ${score || player.score}💎`;
};

function formatMenu(menu) {
    return Object.keys(menu).map(key => {
        return key + ' - ' + menu[key];
    }).join('\n');
};

