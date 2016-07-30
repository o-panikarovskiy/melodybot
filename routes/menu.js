'use strict';
const Chat = require('../models/chat');

let _bot = null;

module.exports = function (bot) {
    _bot = bot;
    bot.onText(/^\/start$/, onHelpStart);
    bot.onText(/^\/help$/, onHelpStart);
    bot.on('new_chat_participant', onNewChatParticipant);
    bot.onText(/^\/groups/, onGroups);
    bot.on('callback_query', onGroupAnswer);
};

function onGroups(msg) {
    if (msg.chat.id !== msg.from.id) return;//disable for groups;
    Chat.find({
        adminId: msg.from.id
    }).then(list => {
        if (!list || !list.length) return _bot.sendMessage(msg.chat.id, 'Сначала надо добавить меня в группу, где вы являетесь администратором.');
        _bot.sendMessage(msg.chat.id, 'Выберите группу для настройки', {
            reply_markup: {
                inline_keyboard: formatGroupsListReplyButtons(list)
            }
        });
    });
};

function onGroupAnswer(msg) {
    //TO DO: show group config
};

function onHelpStart(msg) {
    if (msg.from.id === msg.chat.id) {
        return sendHelpForPrivate(msg);
    };
    return sendHelpForGroup(msg);
};

function onNewChatParticipant(msg) {
    getAndSaveChatAdmins(msg);
    sendHelpForGroup(msg);
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

function getAndSaveChatAdmins(msg) {
    return _bot._request('getChatAdministrators', { form: { chat_id: msg.chat.id } }).then(res => {
        return Promise.all(res.map(row => {
            return saveChatInfo({
                adminId: row.user.id,
                chatId: msg.chat.id,
                chatTitle: msg.chat.title
            });
        }));
    });
};

function saveChatInfo(info) {
    return Chat.findOneAndUpdate({ adminId: info.adminId, chatId: info.chatId }, info, { upsert: true });
};

function formatGroupsListReplyButtons(groups) {
    return groups.map((g, i) => {
        return [
            {
                text: g.chatTitle,
                callback_data: g._id.toString()
            }
        ]
    });
};