const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    price: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String
    },
    rating: {
        type: String
    }
});
const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;
