const express= require("express");
const router = express.Router();
const post = require("../models/post.js");
const User = require("../models/user.js");
const { isLoggedIn, isOwner } = require("../middleware.js");

const upload = require("../middleware/multer.js");
const cloudinary = require("../config/cloudinary.js");

const { PostSchema } = require("../schema.js");

const postController = require("../controllers/post.js");


// store img in cloud
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "RentMate"
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


//create post
router.get("/new",isLoggedIn, postController.renderPostForm);


router
    .route("/")
    //Posts & search 
    .get( postController.allPost)
    //create
    .post(isLoggedIn,upload.array("images", 10), postController.createPost);



//Edit Route
router.get("/:id/edit",isLoggedIn,isOwner, postController.renderEditForm);

router
    .route("/:id")
    // View
    .get(isLoggedIn, postController.viewPost)

    // Edit
    .put(
        isLoggedIn,
        isOwner,
        upload.array("images", 10),
        postController.editPost
    )

    // Delete
    .delete(
        isLoggedIn,
        isOwner,
        postController.deletePost
    );

router.post("/:id/favorite", isLoggedIn, postController.addFavorite);

router.delete("/:id/favorite", isLoggedIn, postController.removeFavorite);

module.exports = router; 