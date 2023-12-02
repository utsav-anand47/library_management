const mongoose = require("mongoose");

const dbConnect = () => {
    mongoose.connect("mongodb://127.0.0.1:27017/bookHeavenDB");

    mongoose.connection.on("connected", () => {
        console.log("Connected to database sucessfully");
    });

    mongoose.connection.on("error", (err) => {
        console.error("Error while connecting to database :" + err);
    });

    mongoose.connection.on("disconnected", () => {
        console.log("Mongodb connection disconnected");
    });
};

module.exports = dbConnect;