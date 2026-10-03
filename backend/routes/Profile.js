const express= require("express");
const router = express.Router();
const post = require("../models/post.js");
const User = require("../models/user.js");
const { isLoggedIn, isOwner } = require("../middleware.js");
const { EditProfileSchema } = require("../schema.js");

const upload = require("../middleware/multer.js");
const cloudinary = require("../config/cloudinary.js");


const profileController = require("../controllers/profile.js");

//helper funtion
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "RentMate/Profile"
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        stream.end(fileBuffer);
    });
};



//edit Profile

router.route("/edit")
.get( isLoggedIn, profileController.renderEditProfileForm)
.put(
    isLoggedIn,
    upload.single("ProfilePic"),
    profileController.editProfile
);


//Profile

router.get("/",isLoggedIn, profileController.profilePage);


module.exports =router;