const User = require('../models/userModel');
const Book = require('../models/bookModel');

const bcrypt = require('bcrypt');
const route = require('express').Router();
const jwt = require('jsonwebtoken');

route.get('/', (req, res) => {
    res.render('home');
});

route.get('/login', (req, res) => {
    res.render('login', { message: '' });
});

route.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.render('login', { message: "Please fill all fields" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { message: "User not found" });
        }

        const matchPasswd = await bcrypt.compare(password, user.password);
        if (!matchPasswd) {
            return res.render('login', { message: "Invalid credentials" });
        }

        const token = jwt.sign({ role: user.type, email: user.email, id: user._id }, 'fhsdgfsggggvgsvg');

        // Set the token in a cookie (you can also send it in the response body)
        res.cookie('token', token, { httpOnly: true });
        res.cookie('user', user.fname + " " + user.lname);
        res.cookie('role', user.type);
        // if (type === 'admin') {
        //     res.redirect('/admin/dashboard');
        // }
        res.redirect('/');
    } catch (error) {
        console.log(error);
        res.render('login', { message: error.message });
    }
});


route.get('/logout', (req, res) => {

    res.clearCookie('token');
    res.clearCookie('user');
    res.clearCookie('role');
    // console.log(req.path);
    res.redirect('back');
    // res.redirect('/login');
});


route.get('/signup', async (req, res) => {
    res.render('signup', { message: "" });
});

route.post('/signup', async (req, res) => {
    try {
        const { fname, lname, email, contactNumber, address, password } = req.body;

        if (!fname || !lname || !email || !contactNumber || !address || !password) {
            return res.render('signup', { message: "Please fill all the fields" });
        }
        const hashPasswd = await bcrypt.hash(password, 10);
        await User.create({ fname, lname, email, contactNumber, address, password: hashPasswd });

        res.redirect('/login');
    } catch (error) {
        console.log(error);
        res.render('signup', { message: error.message });
    }
});

route.get('/books', async (req, res) => {
    try {
        const books = await Book.find();

        res.render('books', { books: books });
    } catch (error) {
        res.status(404).send(error.message)
    }
})

module.exports = route;