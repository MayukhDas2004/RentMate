const User = require("../models/user.js");
const post = require("../models/post.js");
const passport = require("passport");
const { UserSchema } = require("../schema.js");
const crypto = require("crypto");
const transporter = require("../config/mailer.js");
const twilio = require("../config/twilio.js");


module.exports.renderRegisterForm = (req, res) => {
    res.render("Register.ejs");
}


module.exports.register = async (req, res) => {

    try {
        let {
            Name,
            Email,
            password,
            confirmPassword,
            ContactNumber,
            Gender,
            Proffetion,
            About
        } = req.body;

        // Phone verification check
        if (
            !req.session.phoneVerification ||
            !req.session.phoneVerification.verified ||
            req.session.phoneVerification.phone !== ContactNumber
        ) {
            const message = "Please verify your phone number first.";

            if (req.headers.accept && req.headers.accept.includes("application/json")) {
                return res.status(400).json({
                    success: false,
                    field: "ContactNumber",
                    message: message
                });
            }

            req.flash("error", message);
            return res.redirect("/register");
        }

        // Joi validation
        const { error } = UserSchema.validate(req.body);

        if (error) {

            if (req.headers.accept && req.headers.accept.includes("application/json")) {
                return res.status(400).json({
                    success: false,
                    field: error.details[0].path[0],
                    message: error.details[0].message
                });
            }

            req.flash("error", error.details[0].message);
            return res.redirect("/register");
        }

        // Create email verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");

        let newUser = new User({
            Name,
            Email,
            ContactNumber,
            Gender,
            Proffetion,
            About,
            verificationToken: verificationToken,
            verificationTokenExpiry: Date.now() + 5 * 60 * 1000
        });

        // Create user
        let registeredUser = await User.register(newUser, password);

        // Send verification email
        const verificationUrl = `${process.env.APP_URL}/verify-email/${verificationToken}`;

        const { data, error: resendError } = await transporter.emails.send({
            from: "onboarding@resend.dev",
            to: Email,
            subject: "Verify your RentMate account",
            text: `Please verify your RentMate account by clicking this link: ${verificationUrl}`
        });
        
        console.log("RESEND DATA:", data);
        console.log("RESEND ERROR:", resendError);

        console.log(registeredUser);

        // AJAX request
        if (req.headers.accept && req.headers.accept.includes("application/json")) {
            return res.json({
                success: true,
                redirect: "/login"
            });
        }

        // Normal form request
        req.flash(
            "success",
            "Registration successful! Please First Verify Your Mail !"
        );

        res.redirect("/login");

    } catch (err) {

        console.log(err);

        let message;

        if (err.name === "UserExistsError") {
            message = "This email is already registered.";
        } else if (err.code === 11000 && err.keyPattern?.ContactNumber) {
            message = "This phone number is already registered.";
        } else {
            message = "Something went wrong. Please try again.";
        }

        // AJAX request
        if (req.headers.accept && req.headers.accept.includes("application/json")) {
            return res.status(400).json({
                success: false,
                field: err.name === "UserExistsError" ? "Email" : null,
                message: message
            });
        }

        // Normal form request
        req.flash("error", message);
        res.redirect("/register");
    }
};

module.exports.sendPhoneOTP = async (req, res) => {
    try {
        const { ContactNumber } = req.body;

        const phoneNumber = `+91${ContactNumber}`;

        const verification = await twilio.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verifications.create({
                channel: "sms",
                to: phoneNumber
            });

        req.session.phoneVerification = {
            phone: ContactNumber,
            verified: false
        };

        console.log(verification.status);

        res.json({
            success: true,
            message: "OTP sent successfully."
        });

    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to send OTP. Please try again.");
        res.redirect("/register");
    }
};

module.exports.verifyPhoneOTP = async (req, res) => {
    try {
        const { ContactNumber, otp } = req.body;

        console.log("PHONE SESSION:", req.session.phoneVerification);

        const phoneNumber = `+91${req.session.phoneVerification.phone}`;

        const verificationCheck = await twilio.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks.create({
                to: phoneNumber,
                code: otp
            });

        if (verificationCheck.status === "approved") {
            req.session.phoneVerification = {
                phone: req.session.phoneVerification.phone,
                verified: true
            };
            
            console.log("PHONE VERIFIED:", req.session.phoneVerification);

            req.flash("success", "Phone number verified successfully.");
        } else {
            req.flash("error", "Invalid OTP.");
        }

        res.json({
            success: verificationCheck.status === "approved",
            message:
                verificationCheck.status === "approved"
                    ? "Phone number verified successfully."
                    : "Invalid OTP."
        });

    } catch (err) {
        console.log(err);
        req.flash("error", "OTP verification failed. Please try again.");
        res.redirect("/register");
    }
};


module.exports.verifyEmail = async (req, res) => {
    // we will write the verification logic here
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
        req.flash("error", "Invalid verification link.");
        return res.redirect("/login");
    }
    if (user.verificationTokenExpiry < Date.now()) {
        req.flash("error", "Verification link has expired.");
        return res.redirect("/login");
    }
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();
    req.flash("success", "Email verified successfully. You can now login.");
    return res.redirect("/login");

};


module.exports.renderLoginForm = (req, res) => {

    const returnTo =
        req.query.returnTo ||
        req.session.returnTo ||
        "";

    res.render("Login.ejs", {
        returnTo
    });
}

module.exports.login = (req, res) => {

    const redirectUrl =
        (req.body.returnTo && req.body.returnTo.startsWith("/"))
            ? req.body.returnTo
            : "/post";

        delete req.session.returnTo;

        req.flash("success", "Login successful!");

        res.redirect(redirectUrl);
    }

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You have been logged out.");
        res.redirect("/login");
    });
}


module.exports.deleteAccount = async (req, res) => {

    const userId = req.user._id;

    // Find all posts created by this user
    const userPosts = await post.find({ owner: userId });

    // Delete all post images from Cloudinary
    for (let postItem of userPosts) {
        for (let image of postItem.images) {

            if (image.filename) {
                await cloudinary.uploader.destroy(image.filename);
            }

        }
    }

    // Delete all posts created by this user
    await post.deleteMany({ owner: userId });

    // Delete the user account
    await User.findByIdAndDelete(userId);

    // Logout the user
    req.logout((err) => {
        if (err) {
            return res.redirect("/post");
        }

        req.flash("success", "Your account and posts have been deleted.");
        res.redirect("/post");
    });
};