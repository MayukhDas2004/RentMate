const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose").default;

const UserSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },

    ProfilePic: {
        type: String
    },

    ProfilePicPublicId: {
        type: String
    },

    Email: {
        type: String,
        required: true,
        unique: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    
    verificationToken: {
        type: String
    },
    
    verificationTokenExpiry: {
        type: Date,
        expires: 0
    },

    ContactNumber: {
        type: String,
        required: true,
        unique: true
    },

    Gender: {
        type: String,
        required: true
    },

    Proffetion: {
        type: String
    },

    About: {
        type: String,
        maxlength: 150
    },
    Favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "post"
    }]
});

UserSchema.plugin(passportLocalMongoose, {
    usernameField: "Email"
});

const User = mongoose.model("User", UserSchema);

module.exports = User;