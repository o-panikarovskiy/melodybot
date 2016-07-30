'use strict';
const mongoose = require('mongoose');

let schema = new mongoose.Schema({
    id: {
        type: String,
        index: true
    },
    chatId: {
        type: String,
        index: true
    },
    score: {
        type: Number,
        default: 0,
        index: true
    },
    first_name: String,
    last_name: String,
    username: String,
});

schema.methods.fullName = function () {
    let res = this.username;
    if (this.first_name) {
        res = this.first_name + (this.last_name ? ' ' + this.last_name : '');
    };
    return res;
};

module.exports = mongoose.model('Player', schema);