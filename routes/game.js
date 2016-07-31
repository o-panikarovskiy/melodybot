'use strict';
const Chat = require('../models/chat');
const Song = require('../models/song');
const Player = require('../models/player');
const config = require('../config');

const SESSION_TIMEOUT = (config.get('game:sessionTimeout') | 0) * 1000;

let _bot = null;
let _chatSongs = new Map();
let _chatPlayIntervals = new Map();

module.exports = function (bot) {
    _bot = bot;
    bot.onText(/^\/play$/, onPlay);
    bot.onText(/^\/demo$/, onDemo);
    bot.on('callback_query', onAnswer);
    bot.on('left_chat_participant', onBotRemovedFromChat);
    bot.on('new_chat_participant', onBotAddToChat);
    bot.on('group_chat_created', onBotAddToChat);
    bot.on('new_chat_title', onChatUpdate);
    bot.on('intervalChange', onChatPlayIntervalChange);
    setInterval(clearOldChatSongs, 35 * 1000);//clear not answered songs;
    initChatIntervals();
};

function onDemo(msg) {
    return Song.findOne({ id: 'AwADAgADRwQAAv2VKw_b1cdmMxS9tAI' }).then(song => {
        return sendSong(msg.chat.id, song);
    });
};

function onPlay(msg) {
    if (msg.chat.id != msg.from.id) return;//disable play command in group mode
    startGame(msg.chat.id);
};

function onAnswer(msg) {
    let song = _chatSongs.get(msg.message.chat.id);
    if (!song || song.buttonsMessageId != msg.message.message_id) return;
    if (song.playerAnswers.find(a => a.player.id == msg.from.id)) {
        return _bot.answerCallbackQuery(msg.id, 'Нельзя отвечать дважды :)');
    };

    song.isGroupPlay = (msg.from.id != song.chatId);

    let player = msg.from;
    let isAnswerCorrect = (msg.data | 0) === song.right_answer;
    let playerAnswer = {
        isCorrect: isAnswerCorrect,
        player: player,
        score: 0
    };

    player.chatId = msg.message.chat.id;
    song.playerAnswers.push(playerAnswer);

    if (!isAnswerCorrect) {
        if (song.isGroupPlay) {
            return _bot.answerCallbackQuery(msg.id, `Не угадали! ${song.answers[song.right_answer]}`);
        } else {
            return endGame(song);
        };
    };

    //answer is correct
    playerAnswer.score = calcScore(song);

    Player.findOne({
        id: player.id,
        chatId: player.chatId
    }).then(p => {
        if (!p) {
            p = new Player(player);
        } else {
            Object.assign(p, player);
        };

        p.score += playerAnswer.score;
        return p.save();
    });

    if (song.isGroupPlay) {
        return _bot.answerCallbackQuery(msg.id, `ДА! +${playerAnswer.score}! Ждем остальных...`);
    } else {
        return endGame(song);
    };
};

function startGame(chatId) {
    if (_chatSongs.has(chatId)) return; //disable start when has active songs 
    return getRandomSong().then(song => {
        return sendSong(chatId, song);
    });
};

function endGame(song) {
    _chatSongs.delete(song.chatId);
    clearTimeout(song.timerId);

    let text = `Игра окончена!\nПравильный ответ: ${song.answers[song.right_answer]}\n`;
    if (song.isGroupPlay) {
        let winers = song.playerAnswers
            .filter(a => a.isCorrect)
            .slice(0, 10)
            .sort((a, b) => b.score - a.score)
            .map((a, i) => (i + 1) + '. ' + a.player.first_name + (a.player.last_name ? ' ' + a.player.last_name : '') + ': +' + a.score);

        text += (winers.length ? 'Победители:\n' + winers.join('\n') : 'Победителей нет.');
    } else {
        let answer = song.playerAnswers[0];
        text += answer && answer.isCorrect ? `Вы угадали! +${answer.score}. Сыграем еще раз?\n/play` : 'К сожалению, Вы не угадали. Попробуйте еще раз\n/play.';
    };

    _bot.editMessageText(text, {
        message_id: song.buttonsMessageId,
        chat_id: song.chatId,
        reply_markup: ''
    }).then(res => {
        sendSongPoster(song.chatId, song);
    });

};

function calcScore(song) {
    let rest = SESSION_TIMEOUT - (Date.now() - song.start);
    let persent = rest / SESSION_TIMEOUT;
    return Math.ceil(10 * persent);
};

function getRandomSong() {
    let rand = Math.random();
    return Song.find({
        random: { $gte: rand }
    }).sort({ random: 1 }).limit(1).exec().then(res => {
        if (res[0]) return res[0];
        return Song.find({
            random: { $lte: rand }
        }).sort({ random: -1 }).limit(1).exec().then(res => {
            if (res[0]) return res[0];
            return Promise.reject('Song not found!');
        });
    }).catch(err => {
        console.error(err);
    });
};

function sendSong(chatId, song) {
    return _bot.sendVoice(chatId, song.id).then(res => {
        let text = `Выберите правильный ответ. У вас есть ${SESSION_TIMEOUT / 1000} секунд.`;
        return _bot.sendMessage(chatId, text, {
            disable_notification: true,
            reply_markup: {
                inline_keyboard: formatAnswersInlineKeyboard(song)
            }
        });
    }).then(res => {
        song.start = Date.now();
        song.chatId = chatId;
        song.buttonsMessageId = res.message_id;
        song.playerAnswers = [];
        song.timerId = setTimeout(() => endGame(song), SESSION_TIMEOUT);

        _chatSongs.set(chatId, song);
        return res;
    });
};

function sendSongPoster(chatId, song) {
    if (!song.poster_id) return Promise.reject();
    return _bot.sendPhoto(chatId, song.poster_id);
};

function formatAnswersInlineKeyboard(song) {
    return song.answers.map((a, i) => {
        return [
            {
                text: a.trim(),
                callback_data: i + ''
            }
        ]
    });
};

function clearOldChatSongs() {
    for (let song of _chatSongs.values()) {
        if ((Date.now() - song.start) > SESSION_TIMEOUT + 100) {
            endGame(song);
        };
    };
};






function onChatPlayIntervalChange(chatId, minutes) {
    removeChatPlayInterval(chatId);
    createChatPlayInterval(chatId, minutes * 60 * 1000);
};

function onBotAddToChat(msg) {
    if (msg.group_chat_created || (msg.new_chat_participant && msg.new_chat_participant.id == _bot.me.id)) {
        getAndSaveChatAdmins(msg).then(() => {
            initChatIntervals();
            startGame(msg.chat.id);
        });
    };
};

function onChatUpdate(msg) {
    Chat.update({ chatId: msg.chat.id }, { $set: { chatTitle: msg.new_chat_title } }).exec();
};

function onBotRemovedFromChat(msg) {
    if (msg.left_chat_participant && msg.left_chat_participant.id == _bot.me.id) {
        removeChatPlayInterval(msg.chat.id);
        Chat.remove({ chatId: msg.chat.id }).exec();
    };
};

function initChatIntervals() {
    Chat.find().then(groups => {
        groups.forEach((group, i) => {
            if (group.minutesInterval) {
                createChatPlayInterval(group.chatId, group.minutesInterval * 60 * 1000 + i * 1000);
            };
        });
    });
};

function createChatPlayInterval(chatId, ms) {
    let intervalId = setInterval(() => {
        startGame(chatId);
    }, ms);
    _chatPlayIntervals.set(chatId, intervalId);
};

function removeChatPlayInterval(chatId) {
    if (!_chatPlayIntervals.has(chatId)) return;

    let intervalId = _chatPlayIntervals.get(chatId);
    _chatPlayIntervals.delete(chatId);
    clearInterval(intervalId);

    if (!_chatSongs.has(chatId)) return;

    let song = _chatSongs.has(chatId);
    _chatSongs.delete(chatId);
    clearTimeout(song.timerId);
};

function getAndSaveChatAdmins(msg) {
    return _bot._request('getChatAdministrators', { form: { chat_id: msg.chat.id } }).then(res => {
        return Promise.all(res.map(row => {
            let info = new Chat({
                adminId: row.user.id,
                chatId: msg.chat.id,
                chatTitle: msg.chat.title
            });
            return Chat.update({ adminId: info.adminId, chatId: info.chatId }, info, { upsert: true }).exec();
        }));
    });
};