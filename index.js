const express = require('express');
const dbConnect = require('./config/connection');
const checkAuth = require('./config/checkAuth');
const cookieParser = require('cookie-parser');

const app = express();

// Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');


// Connect to DB
dbConnect()

// Routes
app.use("/", require('./routes/indexRoute'));
app.use("/user", checkAuth, require('./routes/userRoute'));
app.use("/admin", require('./routes/adminRoute'));
app.get("/*", (req, res) => {
    res.send('404 Not found');
});


const port = 3000;

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});