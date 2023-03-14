//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session =  require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const ejs = require('ejs');

const { isError } = require('util');


const app = express();


app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret:process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    // cookie: {}
  }));
app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true });



const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
    res.render("home");
})

app.get("/secrets",function(req,res){
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stal   e=0, post-check=0, pre-check=0');
   
    if (req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }

})

app.get("/register", function (req, res) {
    res.render("register");
})

app.post("/register",  (req, res) => {
  
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
               
                res.redirect("/secrets");
                
            });
        }
    });


});


app.get("/login", function (req, res) {
    res.render("login");
});



// app.post("/login", (req, res) => {
// const user = new User({
//     username:req.body.username,
//     password:req.body.password

// });

// req.login(user,function(err){
//     if(err){
//         console.log(err);
//     }else{
//         passport.authenticate("local")(req,res,function(){
//             res.redirect("/secrets");
//         });
//     }
// })
   
// });

app.post("/login", passport.authenticate("local"), function(req, res){
    res.redirect("/secrets");
});


app.get("/logout",(req,res)=>{
    req.logOut((err)=>{
        if(!err){
            res.redirect("/");
        }
    });
  
    
})







app.listen(3000, function () {
    console.log("server started at port 3000");
})
