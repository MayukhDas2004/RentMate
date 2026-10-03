const { model } = require("mongoose");
const post = require("../models/post.js");
const User = require("../models/user.js");
const cloudinary = require("../config/cloudinary.js");
const { EditProfileSchema } = require("../schema.js");

module.exports.renderEditProfileForm = async (req, res) => {
    const userData = await User.findById(req.user._id);

    res.render("EditProfile.ejs", {
        User: userData
    });
};

//helper funtion
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "RentMate/Profile" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        stream.end(buffer);
    });
};



module.exports.editProfile = async (req, res) => {

        const currentUser = await User.findById(req.user._id);

        let newImagePublicId = null;

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);

            req.body.ProfilePic = result.secure_url;
            req.body.ProfilePicPublicId = result.public_id;

            newImagePublicId = result.public_id;
        }

        const { error } = EditProfileSchema.validate(req.body);

        if (error) {

            // Delete newly uploaded image if validation fails
            if (newImagePublicId) {
                await cloudinary.uploader.destroy(newImagePublicId);
            }

            req.flash("error", error.details[0].message);
            return res.redirect("/Profile/edit");
        }

        await User.findByIdAndUpdate(
            req.user._id,
            req.body
        );

        // Delete old image only after successful database update
        if (
            newImagePublicId &&
            currentUser.ProfilePicPublicId
        ) {
            await cloudinary.uploader.destroy(
                currentUser.ProfilePicPublicId
            );
        }

        req.flash("success", "Profile updated successfully.");

        res.redirect("/Profile");
    }

module.exports.profilePage = async (req, res) => {

    let id = req.user._id;

    const userData = await User.findById(id).populate("Favorites");

    userData.Favorites = userData.Favorites.filter(
        favorite => favorite !== null
    );

    const allPosts = await post.find({
        owner: id
    });

    console.log("User ID:", id);
    console.log("Posts found:", allPosts.length);

    res.render("Profile.ejs", {
        User: userData,
        allPosts
    });
}