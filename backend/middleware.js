const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


const sessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
        httpOnly: true,
        sameSite: "lax",   
        maxAge: 1000 * 60 * 60 * 24
    }
};


passport.use(
    new LocalStrategy(
        {
            usernameField: "Email"
        },
        async (Email, password, done) => {
            const user = await User.findOne({ Email });
            if (!user) {
                return done(null, false, { message: "Invalid email or password." });
            }
            if (!user.isEmailVerified) {
                return done(null, false, { message: "Please verify your email first." });
            }
            const { user: authenticatedUser, error } = await user.authenticate(password);
            

            if (!authenticatedUser) {
                return done(null, false, { message: "Invalid email or password." });
            }

            return done(null, user);
        }
    )
);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


module.exports = {
    session,
    sessionOptions,
    passport
};


module.exports.isLoggedIn = (req, res, next) => {

    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;

        req.flash("error", "You must be logged in.");

        return res.redirect(
            `/login?returnTo=${encodeURIComponent(req.originalUrl)}`
        );
    }

    next();
};


module.exports.isOwner = async (req, res, next) => {
    const post = await require("./models/post.js").findById(req.params.id);

    if (!post) {
        req.flash("error", "Post not found.");
        return res.redirect("/post");
    }

    if (!post.owner.equals(req.user._id)) {
        req.flash("error", "You are not allowed to edit or delete this post.");
        return res.redirect("/Profile");
    }

    next();
};


module.exports.setCurrentUser = (req, res, next) => {
    res.locals.currentUser = req.user;
    next();
};


// module.exports.saveRedirectUrl = (req, res, next) => {
//     if (req.session.returnTo) {
//         return next();
//     }

//     req.session.returnTo = req.originalUrl;
//     next();
// };