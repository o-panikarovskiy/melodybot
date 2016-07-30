'use strict';
const Song = require('../models/song.js');
const Player = require('../models/player');

let _bot = null;
let _chatSongs = new Map();

module.exports = function (bot) {
    _bot = bot;
    bot.onText(/^\/play$/, onPlay);
    bot.on('callback_query', onAnswer);
};

function onPlay(msg) {
    if (msg.chat.id != msg.from.id) return;//disable play command in group mode
    getRandomSong().then(song => {
        return sendSong(msg.chat.id, song).then(res => {
            song.chat = msg.chat;
            song.buttons_message_id = res.message_id;
            song.playerAnswers = [];

            _chatSongs.set(msg.chat.id, song);
            return res;
        });
    });
};

function onAnswer(msg) {
    let song = _chatSongs.get(msg.message.chat.id);
    if (!song || song.buttons_message_id != msg.message.message_id) return;

    let player = msg.from;
    let isAnswerCorrect = (msg.data | 0) === song.rightAnswer;
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

function endGame(song) {
    _chatSongs.delete(song.chat.id);
    let text = `Игра окончена!\nПравильный ответ: ${song.answers[song.rightAnswer]}\n`;
    let answer = song.playerAnswers[0];
    text += answer && answer.isCorrect ? `Вы угадали! +${answer.score}. Сыграем еще раз?\n/play` : 'К сожалению, Вы не угадали. Попробуйте еще раз\n/play.';
    _bot.sendMessage(song.chat.id, text);
};

function calcScore(song) {
    return 10;
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