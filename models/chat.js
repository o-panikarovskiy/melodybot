'use strict';
const mongoose = require('mongoose');

let schema = new mongoose.Schema({
    adminId: {
        type: String,
        index: true
    },
    chatId: {
        type: String,
        index: true
    },
    chatTitle: String
});

module.exports = mongoose.model('Chat', schema);