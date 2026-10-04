const User = require("../models/user.js");
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
        if (
            !req.session.phoneVerification ||
            !req.session.phoneVerification.verified ||
            req.session.phoneVerification.phone !== ContactNumber
        ) {
            req.flash("error", "Please verify your phone number first.");
            return res.redirect("/register");
        }

        const { error } = UserSchema.validate(req.body);

        if (error) {
            req.flash("error", error.details[0].message);
            return res.redirect("/register");
        }

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

        let registeredUser = await User.register(newUser, password);

        const verificationUrl = `http://localhost:3000/verify-email/${verificationToken}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: Email,
            subject: "Verify your RentMate account",
            text: `Please verify your RentMate account by clicking this link: ${verificationUrl}`
        });

        console.log(registeredUser);
        req.flash("success", "Registration successful! Please First Verify Your Mail !");
        res.redirect("/login");

    }
    catch (err) {
        console.log(err);

        if (err.name === "UserExistsError") {
            req.flash("error", "This email is already registered.");
        } else {
            req.flash("error", "Something went wrong. Please try again.");
        }

        res.redirect("/register");
    }
}

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