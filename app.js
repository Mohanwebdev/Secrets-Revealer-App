//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var encrypt = require('mongoose-encryption');
const ejs = require('ejs');

const { isError } = require('util');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true });


const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
userSchema.plugin(encrypt, { secret: process.env.SECRET_KEY, encryptedFields: ['password'] });

const User = mongoose.model("User", userSchema);

app.get("/", function (req, res) {
    res.render("home");
})

app.get("/register", function (req, res) {
    res.render("register");
})

app.post("/register", async (req, res) => {
    const userData = new User({

        email: req.body.username,
        password: req.body.password
    });

    try{
       await userData.save();
       res.render("secrets");
    }
    
    catch(err){
        console.log(err);
    }
    

});


app.get("/login", function (req, res) {
    res.render("login");
});



app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    var results = await User.findOne({ email: username }).exec();
    try {
        if (results) {
            if (password === results.password) {
                res.render("secrets");
            }
        }

    }
    catch (err) {
        console.log(err);
    }

});






app.listen(3000, function () {
    console.log("server started at port 3000");
})
