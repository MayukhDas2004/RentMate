const post = require("../models/post.js");
const User = require("../models/user.js");
const cloudinary = require("../config/cloudinary.js");
const { PostSchema } = require("../schema.js");
const mongoose = require("mongoose");


const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "RentMate" },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        stream.end(buffer);
    });
};



module.exports.allPost = async (req, res) => {
    const { location, type, sort } = req.query;
    let filter = {};
    if (location) {
        filter["Location.adress"] = {
            $regex: location,
            $options: "i"
        };
    }
    if (type) {
        filter.PostType = type;
    }
    let sortOption = {};

    if (sort === "rent_asc") {
        sortOption.Rent = 1;
    } else if (sort === "rent_desc") {
        sortOption.Rent = -1;
    } else if (sort === "newest") {
        sortOption.createdAt = -1;
    } else if (sort === "oldest") {
        sortOption.createdAt = 1;
    }

    const allPosts = await post.find(filter).sort(sortOption);
    res.render("AllPost.ejs", {
        allPosts,
        location,
        type,
        sort,
        backUrl: req.originalUrl
    });
}



module.exports.renderPostForm = async (req, res) => {
    res.render("CreateP.ejs");
}

module.exports.createPost = async (req, res) => {
    const uploadedImages = [];

    for (let file of req.files) {
        const result = await uploadToCloudinary(file.buffer);

        uploadedImages.push({
            filename: result.public_id,
            url: result.secure_url
        });
    }

    req.body.images = uploadedImages;

    if (!req.body.Description) {
        req.body.Description = [{}];
    }

    req.body.Description[0].AC =
        req.body.Description[0].AC === "true" || req.body.Description[0].AC === true;

    req.body.Description[0].Furnishing =
        req.body.Description[0].Furnishing === "true" || req.body.Description[0].Furnishing === true;

    const { error } = PostSchema.validate(req.body);

    if (error) {
        req.flash("error", error.details[0].message);
        return res.redirect("/post/new");
    }
    
    const newPost = new post(req.body);

    newPost.owner = req.user._id;

    await newPost.save();

    req.flash("success", "Post created successfully.");

    res.redirect("/Profile");
}


module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;

    const Showpost = await post.findById(id);

    res.render("EditP.ejs", { Showpost });
}

module.exports.editPost = async (req, res) => {

        const { id } = req.params;

        // Get existing post
        const existingPost = await post.findById(id);

        // Get images selected for deletion
        let deleteImages = req.body.deleteImages || [];

        if (!Array.isArray(deleteImages)) {
            deleteImages = [deleteImages];
        }

        // Upload new images
        const newImages = [];
        const newImagePublicIds = [];

        for (let file of req.files) {
            const result = await uploadToCloudinary(file.buffer);

            newImages.push({
                filename: result.public_id,
                url: result.secure_url
            });

            newImagePublicIds.push(result.public_id);
        }

        // Keep old images that were not selected for deletion
        const remainingImages = existingPost.images
            .filter(image => !deleteImages.includes(image.filename))
            .map(image => ({
                filename: image.filename,
                url: image.url
            }));

        // Final images
        req.body.images = [
            ...remainingImages,
            ...newImages
        ];

        delete req.body.deleteImages;

        // Convert checkbox values
        if (!req.body.Description) {
            req.body.Description = [{}];
        }

        req.body.Description[0].AC =
            req.body.Description[0].AC === "true";

        req.body.Description[0].Furnishing =
            req.body.Description[0].Furnishing === "true";

        // Validate
        const { error } = PostSchema.validate(req.body);

        if (error) {

            // Delete newly uploaded images if validation fails
            for (let publicId of newImagePublicIds) {
                await cloudinary.uploader.destroy(publicId);
            }

            req.flash("error", error.details[0].message);
            return res.redirect(`/post/${id}/edit`);
        }

        // Update database first
        await post.findByIdAndUpdate(id, req.body);

        // Delete old images only after successful update
        for (let publicId of deleteImages) {
            await cloudinary.uploader.destroy(publicId);
        }

        req.flash("success", "Post updated successfully.");

        res.redirect("/Profile");
}


module.exports.viewPost = async (req, res) => {

    let { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "Invalid post ID.");
        return res.redirect("/post");
    }

    const Showpost = await post
        .findById(id)
        .populate("owner");

    if (!Showpost) {
        req.flash("error", "Post not found.");
        return res.redirect("/post");
    }

    const isFavorite = req.user.Favorites.some(
        favorite => favorite.toString() === Showpost._id.toString()
    );

    const backUrl = req.query.back || "/post";

    res.render("ViewP.ejs", {
        Showpost,
        backUrl,
        isFavorite
    });
}



module.exports.deletePost = async (req, res) => {

    const { id } = req.params;

    const deletePost = await post.findById(id);

    // Delete images from Cloudinary
    for (let image of deletePost.images) {

        if (image.filename) {
            await cloudinary.uploader.destroy(image.filename);
        }

    }

    // Delete post from MongoDB
    await post.findByIdAndDelete(id);

    req.flash("success", "Post deleted successfully.");

    res.redirect("/Profile");
};



module.exports.addFavorite = async (req, res) => {
    const { id } = req.params;
    const backUrl = req.query.back || "/post";

    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "Invalid post ID.");
        return res.redirect("/post");
    }

    const existingPost = await post.findById(id);

    if (!existingPost) {
        req.flash("error", "Post not found.");
        return res.redirect("/post");
    }

    const user = await User.findById(req.user._id);

    if (!user.Favorites.some(favorite => favorite.toString() === id)) {
        user.Favorites.push(id);
        await user.save();
    }

    res.redirect(`/post/${id}?back=${encodeURIComponent(backUrl)}`);
};

module.exports.removeFavorite = async (req, res) => {
    const { id } = req.params;
    const backUrl = req.query.back || "/post";

    const user = await User.findById(req.user._id);

    user.Favorites = user.Favorites.filter(
        favorite => favorite.toString() !== id
    );

    await user.save();

    res.redirect(`/post/${id}?back=${encodeURIComponent(backUrl)}`);
};
