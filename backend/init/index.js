const mongoose = require("mongoose");
const initPData = require("./Pdata.js");
const initUData = require("./Udata.js");
const post = require("../models/post.js");
const User = require("../models/user.js")
const MONGO_URL = "mongodb://127.0.0.1:27017/RentMate1";
main()
    .then(() => {
        console. log("connected to DB");
    })
    .catch((err) => {
        console. log(err);
    })

async function main() {
    await mongoose.connect (MONGO_URL);
}

const initDB = async() =>{
    await post.deleteMany({});
    await User.deleteMany({});
    await post.insertMany(initPData.data);
    await User.insertMany(initUData.data);
    console.log("data was initialized");

};
initDB();