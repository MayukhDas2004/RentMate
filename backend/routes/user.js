const express = require("express");
const router = express.Router();

const User = require("../models/user.js");
const passport = require("passport");

const { UserSchema } = require("../schema.js");

const userController = require("../controllers/user.js")

const loginLimiter = require("../middleware/rateLimit.js");
const { isLoggedIn } = require("../middleware.js");

//Register

router
    .route("/register")
    .get( userController.renderRegisterForm)
    .post( userController.register);


router.post("/send-phone-otp", userController.sendPhoneOTP);

router.post("/verify-phone-otp", userController.verifyPhoneOTP);


// Email verification
router.get(
    "/verify-email/:token", 
    userController.verifyEmail
);


//LOGIN

router
    .route("/login")
    .get( userController.renderLoginForm)
    .post(
        loginLimiter,
        passport.authenticate("local", {
            failureRedirect: "/login",
            failureFlash: true
        }),
        userController.login
    );




//LOG OUT
router.get("/logout", userController.logout);


//Delete Account
router.delete("/delete-account", isLoggedIn, userController.deleteAccount);


module.exports = router;

