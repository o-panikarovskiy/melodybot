'use strict';
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const path = require('path');
const config = require('./config');

const REPOSITORY_CONNECTION_STRING = config.get('repository:connectionString');
const TELEGRAM_BOT_TOKEN = config.get('app:token');
const IS_PROD = config.get('app:env') === 'production';
const APP_IP = config.get('app:ip');
const APP_PORT = config.get('app:port');

const WEB_HOOK_URL = APP_IP + ':' + APP_PORT + '/bot' + config.get('app:token');
const CERT_KEY_PATH = path.join(__dirname, 'certificates', 'cert.key');
const CERT_PATH = path.join(__dirname, 'certificates', 'cert.pem');


mongoose.Promise = global.Promise;
mongoose.connect(REPOSITORY_CONNECTION_STRING).then(() => {
    console.info('Mongo connection success!');
    initBot();
});

function initBot() {
    if (!IS_PROD) return initBotPolling();
    return initBotWebHook();
};

function initBotWebHook() {
    let bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {
        webHook: {
            port: APP_PORT,
            key: CERT_KEY_PATH,
            cert: CERT_PATH
        }
    });

    return bot.setWebHook(WEB_HOOK_URL, CERT_PATH).then(res => {
        return getMe(bot);
    }).then(me => {
        console.log('Bot started in webhook mode.');
        require('./routes/menu')(bot);
        require('./routes/admin')(bot);
        require('./routes/game')(bot);
        require('./routes/leaderboards')(bot);
    });
};

function initBotPolling() {
    let bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
    return getMe(bot).then(me => {
        console.log('Bot started in polling mode.');
        require('./routes/menu')(bot);
        require('./routes/admin')(bot);
        require('./routes/game')(bot);
        require('./routes/leaderboards')(bot);
    });
};


function getMe(bot) {
    if (bot.me) return Promise.resolve(bot.me);
    return bot.getMe().then(user => {
        bot.me = user;
        return user;
    });
};