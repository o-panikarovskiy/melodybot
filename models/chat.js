'use strict';
const mongoose = require('mongoose');

let schema = new mongoose.Schema({
    adminId: {
        type: Number,
        index: true
    },
    chatId: {
        type: Number,
        index: true
    },
    chatTitle: String,
    timeout: Number
});

module.exports = mongoose.model('Chat', schema);