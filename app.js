const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const config = require('./config');

const REPOSITORY_CONNECTION_STRING = config.get('repository:connectionString');

mongoose.Promise = global.Promise;
mongoose.connect(REPOSITORY_CONNECTION_STRING).then(() => {
    console.info('Mongo connection success!');
});