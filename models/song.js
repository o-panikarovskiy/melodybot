'use strict';
const mongoose = require('mongoose');

let schema = new mongoose.Schema({
    id: {
        //telegram id
        type: String,
        index: true
    },
    name: String,
    genre: String,
    poster: String,
    posterPath: String,
    answers: [{ type: String }],
    rightAnswer: Number
});

module.exports = mongoose.model('Song', schema);