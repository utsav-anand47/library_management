const mongoose = require("mongoose");

const borrowHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
    },
    borrowedDate: {
        type: Date,
        default: new Date(),
    },
    returnedDate: {
        type: Date,
    },
    expextedReturnedDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['cart', 'borrowed', 'returned'],
        default: 'cart',
    },
});

const BorrowHistory = mongoose.model("BorrowHistory", borrowHistorySchema);

module.exports = BorrowHistory;
