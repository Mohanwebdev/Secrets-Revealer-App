//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session =  require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-find-or-create');


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


mongoose.connect("mongodb+srv://"+process.env.DB_USERNAME+":"+process.env.DB_PASSWORD+"@cluster0.bn8mc.mongodb.net/SecretsApp?retryWrites=true&w=majority", { useNewUrlParser: true });


const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("https://secrets-app-ly0s.onrender.com/", function (req, res) {
    res.render("home");
});

app.get('https://secrets-app-ly0s.onrender.com/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('https://secrets-app-ly0s.onrender.com/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("https://secrets-app-ly0s.onrender.com/secrets",async(req,res)=>{
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stal   e=0, post-check=0, pre-check=0');
   
    if (req.isAuthenticated()){
        try{
            const secrets = await User.find({secret: { $ne: null }});
            
            res.render("secrets",{userSecrets:secrets});
        }
        catch(err){
            console.log(err);
        }
      
    }else{
        res.redirect("https://secrets-app-ly0s.onrender.com/login");
    }

})

app.get("https://secrets-app-ly0s.onrender.com/register", function (req, res) {
    res.render("register");
})

app.post("https://secrets-app-ly0s.onrender.com/register",  (req, res) => {
  
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("https://secrets-app-ly0s.onrender.com/register");
        }else{
            passport.authenticate("local")(req,res,function(){
               
                res.redirect("https://secrets-app-ly0s.onrender.com/secrets");
                
            });
        }
    });


});


app.get("https://secrets-app-ly0s.onrender.com/login", function (req, res) {
    res.render("login");
});


app.post("https://secrets-app-ly0s.onrender.com/login", passport.authenticate("local"), function(req, res){
    res.redirect("https://secrets-app-ly0s.onrender.com/secrets");
});


app.get("https://secrets-app-ly0s.onrender.com/logout",(req,res)=>{
    req.logOut((err)=>{
        if(!err){
            res.redirect("https://secrets-app-ly0s.onrender.com/");
        }
    });
  
    
})

app.get("https://secrets-app-ly0s.onrender.com/submit",(req,res)=>{
    if (req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("https://secrets-app-ly0s.onrender.com/login");
    }
   
})

app.post("https://secrets-app-ly0s.onrender.com/submit",async(req,res)=>{
    try{
        await User.findByIdAndUpdate(req.user.id, { secret: req.body.secret }); 
        res.redirect("https://secrets-app-ly0s.onrender.com/secrets");
    }
    catch(err){
        console.log(err);
    }
  
        
    })



app.listen(process.env.PORT || 3000, function () {
    console.log("server started at port 5000");
})
