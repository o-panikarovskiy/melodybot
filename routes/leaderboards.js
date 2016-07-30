'use strict';
const Player = require('../models/player');
let _bot = null;

module.exports = function (bot) {
    _bot = bot;
    bot.onText(/^\/top$/, showLeaders);
};

function showLeaders(msg) {
    if (msg.chat.id == msg.from.id) return getTotalTop(msg);
    return getChatTop(msg);
};

function getChatTop(msg) {
    return Player.find({
        chatId: msg.chat.id
    }).sort({ score: -1 }).limit(10).exec().then(players => {
        let list = players.map(formatRow);
        let text = (list.length > 0) ? `Рейтинг чата:\n${list.join('\n')}` : 'Еще нет результатов.';

        return _bot.sendMessage(msg.chat.id, text);
    });
};

function getTotalTop(msg) {
    return Player.aggregate([
        {
            $group: {
                _id: '$id',
                first_name: { $first: '$first_name' },
                last_name: { $first: '$last_name' },
                username: { $first: '$username' },
                score: {
                    $sum: '$score'
                }
            }
        },
        {
            $sort: { score: -1 }
        },
        {
            $limit: 10
        }
    ]).exec().then(players => {
        let list = players.map(formatRow);
        let text = (list.length > 0) ? `Общий рейтинг игроков:\n${list.join('\n')}` : 'Еще нет результатов.';

        return _bot.sendMessage(msg.chat.id, text);
    });
};

function formatRow(player, position) {
    let name = player.first_name ? (player.first_name + (player.last_name ? ' ' + player.last_name : '')) : '';
    name = name ? name + (player.username ? ` (@${player.username})` : '') : 'Nobody';
    return `${position + 1}. ${name}: ${player.score}`;
};