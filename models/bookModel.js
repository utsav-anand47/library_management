const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    imgUrl: {
        type: String,
    },
    bookNumber: {
        type: String,
        required: true,
        unique: true,
    },
    availableCopies: {
        type: Number,
        required: true,
        min: 0,
    },
    totalCopies: {
        type: Number,
        required: true,
        min: 0,
    },
    genre: {
        type: String,
    },
});

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;