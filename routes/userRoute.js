const route = require('express').Router();
const Book = require('../models/bookModel');
const BorrowHistory = require('../models/borrowHistoryModel');


route.get('/dashboard', async (req, res) => {
    const userId = req.user.id;
    try {
        const takenBooks = await BorrowHistory.find({ userId: userId }).populate('bookId');

        res.render('dashboard', { takenBooks });
    } catch (error) {
        res.status(404).send(error.message);
    }
});

route.get('/checkout-books', async (req, res) => {
    const userId = req.user.id;
    try {
        const cartBooks = await BorrowHistory.find({ userId: userId, status: "cart" }).populate('bookId');

        res.render('checkoutBook', { cartBooks });
    } catch (error) {
        res.status(404).send(error.message);
    }
    res.render('checkoutBook');
});

route.post('/checkout-books', async (req, res) => {
    const { borrowIds } = req.body;

    try {
        if (!borrowIds || !Array.isArray(borrowIds)) {
            return res.status(400).send("Invalid request. Please provide an array of borrowIds.");
        }

        // Find the borrowed books and update their status to "borrowed"
        const updatedBorrowHistory = await BorrowHistory.updateMany(
            { _id: { $in: borrowIds }, status: 'cart' }, // Only update if the status is "cart"
            { status: 'borrowed' },
        );

        // Find the details of the borrowed books
        const borrowedBooks = await BorrowHistory.find({ _id: { $in: borrowIds }, status: 'borrowed' });

        // Update the available count of the books
        for (const borrowedBook of borrowedBooks) {
            const bookId = borrowedBook.bookId;
            await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } });
        }

        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

route.post('/return-book', async (req, res) => {
    const { returnId } = req.body;

    try {
        if (!returnId) {
            return res.status(400).send("Invalid request. Please provide an array of returnId.");
        }

        // Find the borrowed books and update their status to "returned"
        const updatedBorrowHistory = await BorrowHistory.findOneAndUpdate(
            { _id: returnId, status: 'borrowed' }, // Only update if the status is "borrowed"
            { status: 'returned', returnedDate: new Date() },
        );

        // Find the details of the returned books
        const returnedBooks = await BorrowHistory.find({ _id: returnId, status: 'returned' });

        // Update the available count of the books
        for (const returnedBook of returnedBooks) {
            const bookId = returnedBook.bookId;
            await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
        }

        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = route;