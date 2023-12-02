const route = require('express').Router();
const Book = require('../models/bookModel');
const BorrowHistory = require('../models/borrowHistoryModel');
const User = require('../models/userModel');

route.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        console.log(users);
        res.render('users', { users });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

route.get('/dashboard', async (req, res) => {
    res.render('adminDashboard');
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

route.get('/borrowed-books', async (req, res) => {
    try {
        // Find the borrowed books and populate the user and book details
        const borrowedBooks = await BorrowHistory.find({ status: 'borrowed' })
            .populate('userId')
            .populate('bookId');
        console.log(borrowedBooks);
        res.render('borrowedBooks', { borrowedBooks });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

route.get('/add-book', async (req, res) => {

    res.render('addBook');
});

route.post('/add-book', async (req, res) => {
    const { title, author, bookNumber, totalCopies, genre } = req.body;

    try {
        if (!title || !author || !bookNumber || !totalCopies || !genre) {
            return res.status(400).send("Please fill all fields");
        }

        // Check if the book with the given ISBN already exists
        const existingBook = await Book.findOne({ bookNumber });
        if (existingBook) {
            return res.status(400).send("Book with the given Book Number already exists");
        }

        // Create a new book
        const newBook = await Book.create({
            title,
            author,
            bookNumber,
            totalCopies,
            availableCopies: totalCopies, // Initially, all copies are available
            genre,
        });

        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});


route.get('/edit-book/:id', async (req, res) => {
    const bookId = req.params.id;

    try {
        // Check if the book exists
        const existingBook = await Book.findById(bookId);
        if (!existingBook) {
            return res.status(404).send("Book not found");
        }

        // Render the edit book form with existing book details
        res.render('editBook', { book: existingBook });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

route.post('/edit-book/:id', async (req, res) => {
    const bookId = req.params.id;
    const { title, author, totalCopies, genre } = req.body;

    try {
        // Check if the book exists
        const existingBook = await Book.findById(bookId);
        if (!existingBook) {
            return res.status(404).send("Book not found");
        }

        // Update the book details
        existingBook.title = title;
        existingBook.author = author;
        existingBook.totalCopies = totalCopies;
        existingBook.genre = genre;

        // Save the updated book details to the database
        await existingBook.save();

        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});



module.exports = route