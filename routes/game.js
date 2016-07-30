'use strict';
const Song = require('../models/song.js');
const Player = require('../models/player');
const config = require('../config');

const SESSION_TIMEOUT = (config.get('game:sessionTimeout') | 0) * 1000;

let _bot = null;
let _chatSongs = new Map();

module.exports = function (bot) {
    _bot = bot;
    bot.onText(/^\/play$/, onPlay);
    bot.on('callback_query', onAnswer);
};

function onPlay(msg) {
    if (msg.chat.id != msg.from.id) return;//disable play command in group mode
    startGame(msg);
};

function onAnswer(msg) {
    let song = _chatSongs.get(msg.message.chat.id);
    if (!song || song.buttonsMessageId != msg.message.message_id) return;

    let player = msg.from;
    let isAnswerCorrect = (msg.data | 0) === song.right_answer;
    let playerAnswer = {
        isCorrect: isAnswerCorrect,
        player: player,
        score: 0
    };

    player.chatId = msg.message.chat.id;
    song.playerAnswers.push(playerAnswer);

    if (!isAnswerCorrect) return endGame(song);

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

    endGame(song);
};

function startGame(chatId) {
    return getRandomSong().then(song => {
        return sendSong(chatId, song).then(res => {
            song.chatId = chatId;
            song.buttonsMessageId = res.message_id;
            song.playerAnswers = [];
            song.timerId = setTimeout(() => endGame(song), SESSION_TIMEOUT);

            _chatSongs.set(chatId, song);
            return res;
        });
    });
};

function endGame(song) {
    _chatSongs.delete(song.chat.id);
    clearTimeout(song.timerId);

    let text = `Игра окончена!\nПравильный ответ: ${song.answers[song.right_answer]}\n`;
    let answer = song.playerAnswers[0];
    text += answer && answer.isCorrect ? `Вы угадали! +${answer.score}. Сыграем еще раз?\n/play` : 'К сожалению, Вы не угадали. Попробуйте еще раз\n/play.';
    _bot.sendMessage(song.chat.id, text);
};

function calcScore(song) {
    //TO DO: return percent
    return 10;
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