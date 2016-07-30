'use strict';
let Song = require('../models/song.js');

let _bot = null;
let _chatSongs = new Map();

module.exports = function (bot) {
    _bot = bot;
    bot.onText(/^\/play$/, onPlay);
    bot.on('callback_query', onAnswer);
};

function onPlay(msg) {
    if (msg.chat.id != msg.from.id) return;//disable play in group mode
    getRandomSong().then(song => {
        return sendSong(msg.chat.id, song).then(res => {
            song.chat = msg.chat;
            song.buttons_message_id = res.message_id;

            _chatSongs.set(msg.chat.id, song);
            return res;
        });
    });
};

function onAnswer(msg) {
    let song = _chatSongs.get(msg.message.chat.id);
    if (!song || song.buttons_message_id != msg.message.message_id) return;

    song.isAnswerCorrect = (msg.data | 0) === song.rightAnswer;
    endGame(song);
};

function endGame(song) {
    _chatSongs.delete(song.chat.id);
    let text = `Игра окончена!\nПравильный ответ: ${song.answers[song.rightAnswer]}\n`;
    text += song.isAnswerCorrect ? `Вы угадали! Сыграем еще раз?\n/play` : 'К сожалению, Вы не угадали. Попробуйте еще раз\n/play.';
    _bot.sendMessage(song.chat.id, text);
};

function getRandomSong() {
    let rand = Math.random();
    return Song.find({
        random: { $gte: rand },
        answers: { $exists: true, $ne: [] },
        rightAnswer: { $exists: true }
    }).sort({ random: 1 }).limit(1).exec().then(res => {
        if (res[0]) return res[0];
        return Song.find({
            random: { $lte: rand },
            answers: { $exists: true, $ne: [] },
            rightAnswer: { $exists: true }
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
        let text = `Выберите правильный ответ.`;
        return _bot.sendMessage(chatId, text, {
            disable_notification: true,
            reply_markup: {
                inline_keyboard: formatAnswersInlineKeyboard(song)
            }
        });
    });
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