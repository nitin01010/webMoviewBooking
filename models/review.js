const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: true,
        trim: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
