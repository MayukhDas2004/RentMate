const mongoose = require("mongoose");
const Schema= mongoose.Schema;
const PostSchema = new Schema({

    PostType :{
        type:"string",
        required:true
    },
    owner : {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    Rent:{
        type:Number,
        required:true
    },
    Location: {
        adress:{
            type: String, 
            required: true
        },
        url:{
            type: String,
        }
    },
    contactNumber:{
        type:"number",
        required:"true"
    },
    Email:{
        type:"string"
    },
    Deposit:{
        type:Number,
        required:true
    },
    GenderPreferance :{
        type: String,
        required: true
    },
    Description: [
        {
            AC:{
                type: Boolean,
                required:true
            },
            Furnishing:{
                type: Boolean,
                required:true
            },
        }
    ],
    Rules: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    images: [
        {
            filename: {
                type: String
            },

            url: {
                type: String,
                required: true
            }
        }
    ]
});

const post =mongoose.model("post",PostSchema);
module.exports= post;