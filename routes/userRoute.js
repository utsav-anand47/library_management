const route = require('express').Router();
const Book = require('../models/bookModel');
const BorrowHistory = require('../models/borrowHistoryModel');
const User = require('../models/userModel');


route.get('/profile', async (req, res) => {
    const userId = req.user.id;
    try {
        const profileData = await User.findById(userId);

        res.render('profile', { profileData, message: "" });
    } catch (error) {
        res.status(404).send(error.message);
    }
});

route.post('/profile', async (req, res) => {
    const { fname, lname, email, contactNumber, oldPassword, newPassword, address } = req.body;
    const userId = req.user.id;
    try {
        const existingProfileData = await User.findById(userId);
        if (!existingProfileData) {
            return res.status(400).send("User not found");
        }


        if (oldPassword) {
            if (oldPassword !== newPassword) {
                return res.render('profile', { profileData: existingProfileData, message: "Password not matched" });
            }

            const matchPasswd = await bcrypt.compare(oldPassword, existingProfileData.password);
            if (!matchPasswd) {
                return res.render('profile', { profileData: existingProfileData, message: "Invalid credentials" });
            }
            existingProfileData.password = password;
        }

        // Update the book details
        existingProfileData.fname = fname;
        existingProfileData.lname = lname;
        existingProfileData.email = email;
        existingProfileData.contactNumber = contactNumber;
        existingProfileData.address = address;

        // Save the updated book details to the database
        await existingProfileData.save();

        res.redirect('/user/profile');
    } catch (error) {
        console.log(error);
        res.status(404).send(error.message);
    }
});


route.get('/dashboard', async (req, res) => {
    const userId = req.user.id;
    try {
        const takenBooks = await BorrowHistory.find({ userId: userId, status: 'borrowed' }).populate('bookId');
        const returnedBooks = await BorrowHistory.find({ userId: userId, status: 'returned' }).populate('bookId');
        res.render('dashboard', { takenBooks, returnedBooks });
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
            { status: 'borrowed', expextedReturnedDate: typeDate, borrowedDate: new Date() },
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