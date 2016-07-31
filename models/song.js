'use strict';
const mongoose = require('mongoose');

let schema = new mongoose.Schema({
    id: {
        //telegram id
        type: String,
        index: true
    },
    genre: {
        type: String,
        index: true
    },
    values_all: [{ type: Number }],
    performer: String,
    lyrics: String,
    performers: [{ type: String }],
    poster: String,
    poster_id: String,
    file_mp3: String,
    performer_id: String,
    type: Number,
    track_name: String,
    timestudy: Number,
    answers: [{ type: String }],
    right_answer: Number,
    muzis_id: String,
    random: Number,
    genre_id: String
});

module.exports = mongoose.model('Song', schema);