const dns = require("dns");
dns.setServers(["1.1.1.1"]);


if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}


const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const helmet = require("helmet");


require("dotenv").config();

require("./config/mailer.js");


const { session, sessionOptions, passport, setCurrentUser } = require("./middleware.js");



const mongoose = require("mongoose");
const MONGO_URL =process.env.MONGO_URL;



const postRouter = require("./routes/post.js");
const ProfileRouter = require("./routes/Profile.js");
const userRouter = require("./routes/user.js");


main()
    .then(() => {
        console. log("connected to DB");
    })
    .catch((err) => {
        console. log(err);
    })
async function main() {
    await mongoose.connect (MONGO_URL);
};

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net","https://fonts.googleapis.com"],
                connectSrc: ["'self'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
                upgradeInsecureRequests: null
            }
        }
    })
);

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"../frontend/views"));
app.engine('ejs', ejsMate);
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend/public")));

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(setCurrentUser);

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});


app.use(methodOverride("_method"));


//home 
app.get("/",(req,res) =>{
    res.send("Welcome to RentMate Site..");
});



//posts route
app.use("/post", postRouter);




//Profile Route
app.use("/Profile", ProfileRouter);



//User Route
app.use("/", userRouter);



//Multer errors
app.use((err, req, res, next) => {

    if (err.name === "MulterError") {
        req.flash("error", err.message);
        return res.redirect("back");
    }

    if (err.message === "Only image files are allowed.") {
        req.flash("error", err.message);
        return res.redirect("back");
    }

    next(err);
});


// General errors
app.use((err, req, res, next) => {
    console.log(err);

    req.flash("error", "Something went wrong.");
    res.redirect("/post");
});


// 404
app.use((req, res) => {
    res.status(404).render("404.ejs");
});



//connect to localhost
app.listen(process.env.PORT || 3000, () => {
    console.log("app is listing on 3000");
});