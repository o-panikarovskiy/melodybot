'use strict';
const Utils = require('../utils');
const Chat = require('../models/chat');

let _bot = null;

module.exports = function (bot) {
    _bot = bot;
    bot.onText(/^\/groups$/, onGroups);
    bot.on('new_chat_participant', onAddToChat);
    bot.on('group_chat_created', onAddToChat);
    bot.on('callback_query', onGroupAnswer);
};

function onAddToChat(msg) {
    if (msg.group_chat_created || (msg.new_chat_participant && msg.new_chat_participant.id == _bot.me.id)) {
        Utils.sendHelpForGroup(_bot, msg);
    };
};

function onGroups(msg) {
    if (msg.chat.id !== msg.from.id) return;//disable for chats;

    Chat.find({
        adminId: msg.from.id
    }).then(list => {
        if (!list || !list.length) return _bot.sendMessage(msg.chat.id, 'Сначала надо добавить меня в чат, где вы являетесь администратором.');
        _bot.sendMessage(msg.chat.id, 'Выберите чат для настройки', {
            reply_markup: {
                inline_keyboard: list.map((g, i) => {
                    return [{ text: g.chatTitle, callback_data: '_id:' + g._id.toString() }];
                })
            }
        });
    });
};

function onGroupAnswer(msg) {
    let answer = msg.data;
    let types = answer.split(':');
    switch (types[0]) {
        case '_id':
            return onGroupSelected(msg, types[1]);
        case 'timer':
            return onTimerChange(msg, types[1], types[2]);
    }
};


function onGroupSelected(msg, id) {
    Chat.findOne({ _id: id }).then(group => {
        if (!group) return;
        editGroupConfigMessage(msg, id, group.minutesInterval);
    });
};

function onTimerChange(msg, groupId, prevVal) {
    let nextVal = '';
    switch (prevVal) {
        case '2':
            nextVal = '5';
            break;
        case '5':
            nextVal = '10';
            break;
        case '10':
            nextVal = '15';
            break;
        case '15':
            nextVal = '30';
            break;
        case '30':
            nextVal = '60';
            break;
        case '60':
            nextVal = '120';
            break;
        default:
            nextVal = '2';
            break;
    };


    Chat.findOneAndUpdate({ _id: groupId }, { $set: { minutesInterval: nextVal | 0 } }).then(res => {
        _bot.emit('intervalChange', res.chatId, nextVal | 0);
        editGroupConfigMessage(msg, groupId, nextVal);
    });
};

function editGroupConfigMessage(msg, groupId, timerCount) {
    return _bot.editMessageText('Выберите настройки', {
        message_id: msg.message.message_id,
        chat_id: msg.message.chat.id,
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Таймер (минуты):', callback_data: '_empty' }, { text: timerCount + '', callback_data: 'timer:' + groupId + ':' + timerCount }]
            ]
        }
    });
};