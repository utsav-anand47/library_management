const route = require('express').Router();
const { default: mongoose } = require('mongoose');
const Book = require('../models/bookModel');
const BorrowHistory = require('../models/borrowHistoryModel');
const User = require('../models/userModel');
const checkDiff = require('../config/ckeckDiff')

route.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.render('users', { users });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

route.get('/books', async (req, res) => {
    try {
        const books = await Book.find();
        res.render('editBooks', { books });
    } catch (error) {
        res.status(400).send(error.message)
    }

});

route.get('/dashboard', async (req, res) => {
    res.render('adminDashboard');
});

route.get('/take-book', async (req, res) => {
    res.render('takeBook', { message: "" });
});

route.post('/take-book', async (req, res) => {
    const { bookNumber, email } = req.body;

    try {
        if (!bookNumber || !email) {
            return res.status(400).send("Please provide any values.");
        }

        const foundBook = await Book.findOne({ bookNumber });

        if (!foundBook) {
            return res.render('takeBook', { message: "Book not found" });
        }

        const foundUser = await User.findOne({ email });

        if (!foundBook) {
            return res.render('takeBook', { message: "Book not found" });
        }


        const updatedBorrowHistory = await BorrowHistory.findOneAndUpdate(
            { bookId: foundBook._id, userId: foundUser._id, status: 'borrowed' }, // Only update if the status is "borrowed"
            { status: 'returned', returnedDate: new Date() },
        );

        if (!updatedBorrowHistory) {
            return res.render('takeBook', { message: "No book found with the given details" });
        }

        await Book.findOneAndUpdate({ bookNumber },
            { $inc: { availableCopies: 1 } });

        res.render('takeBook', { message: "You are returning after " + checkDiff(updatedBorrowHistory.expextedReturnedDate, updatedBorrowHistory.returnedDate) + " days." });
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
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).send('Invalid bookId format');
        }
        // Check if the book exists
        const existingBook = await Book.findById(bookId);
        if (!existingBook) {
            return res.status(404).send("Book not found");
        }

        // Render the edit book form with existing book details
        res.render('editBook', { book: existingBook });
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
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

        res.redirect('/admin/books');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});



module.exports = route