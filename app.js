'use strict';
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const config = require('./config');

const REPOSITORY_CONNECTION_STRING = config.get('repository:connectionString');
const TELEGRAM_BOT_TOKEN = config.get('app:token');



mongoose.Promise = global.Promise;
mongoose.connect(REPOSITORY_CONNECTION_STRING).then(() => {
    console.info('Mongo connection success!');
    initBot();
});


function initBot() {
    let bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });  
    require('./routes/menu')(bot);
    require('./routes/game')(bot);
};