const route = require('express').Router();
const Book = require('../models/bookModel');
const BorrowHistory = require('../models/borrowHistoryModel');


route.get('/dashboard', async (req, res) => {
    const userId = req.user.id;
    try {
        const takenBooks = await BorrowHistory.find({ userId: userId }).populate('bookId');
        console.log(takenBooks);
        res.render('dashboard', { takenBooks });
    } catch (error) {
        res.status(404).send(error.message);
    }
});

route.post('/addtocart', async (req, res) => {
    const { bookId } = req.body;
    const userId = req.user?.id


    try {
        if (!userId || !bookId) {
            return res.status(400).send("Please provide all data.");
        }

        // Find the borrowed books and update their status to "borrowed"
        await BorrowHistory.create({
            userId,
            bookId
        });

        res.redirect('/books');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
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

});

route.post('/checkout-books', async (req, res) => {
    const { borrowIds, returnDate } = req.body;

    try {
        if (!borrowIds || !returnDate || !Array.isArray(borrowIds)) {
            return res.status(400).send("Invalid request. Please provide sufficent data.");
        }
        
        // Find the borrowed books and update their status to "borrowed"
        const typeDate = new Date(returnDate);
        const updatedBorrowHistory = await BorrowHistory.updateMany(
            { _id: { $in: borrowIds }, status: 'cart' }, // Only update if the status is "cart"
            { status: 'borrowed', returnedDate: typeDate, borrowedDate: new Date() },
        );

        // Find the details of the borrowed books
        const borrowedBooks = await BorrowHistory.find({ _id: { $in: borrowIds }, status: 'borrowed' });

        // Update the available count of the books
        for (const borrowedBook of borrowedBooks) {
            const bookId = borrowedBook.bookId;
            await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } });
        }

        res.redirect('/user/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = route;