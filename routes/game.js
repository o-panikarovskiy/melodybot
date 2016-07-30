'use strict';
let Song = require('../models/song.js');

let _bot = null;

module.exports = function (bot) {
    _bot = bot;
    bot.onText(/^\/play$/, onPlay);
};

function onPlay(msg) {
    if (msg.chat.id != msg.from.id) return;//group mode
    _bot.sendMessage(msg.chat.id, 'GAME GO!');
};

function getRandomSong() {
    //TO DO: find random song;
};