const Joi = require("joi");

const UserSchema = Joi.object({
    Name: Joi.string().trim().min(2).max(50).required(),

    Email: Joi.string().email().required(),

    password: Joi.string().min(6).required(),

    confirmPassword: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
            "any.only": "Passwords do not match"
        }),

    ContactNumber: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .required(),

    Gender: Joi.string()
        .valid("Male", "Female", "Other")
        .required(),

    Proffetion: Joi.string().allow(""),

    About: Joi.string().max(150).allow("")
}).unknown(false);



const PostSchema = Joi.object({
    Title: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .required(),
    PostType: Joi.string()
        .valid("PG", "Flat", "Roommate")
        .required(),

    Rent: Joi.number()
        .min(0)
        .required(),

    Location: Joi.object({
        adress: Joi.string()
            .trim()
            .min(3)
            .max(300)
            .required(),

        url: Joi.string()
            .uri()
            .allow("")
            .optional()
    }).required(),

    contactNumber: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .required(),

    Email: Joi.string()
        .email()
        .allow(""),

    Deposit: Joi.number()
        .min(0)
        .required(),

    GenderPreferance: Joi.string()
        .valid("Male", "Female", "Any")
        .required(),
    Description: Joi.array()
        .items(
            Joi.object({
                AC: Joi.boolean().required(),
                Furnishing: Joi.boolean().required()
            })
        ),

    images: Joi.array()
        .min(1)
        .items(
            Joi.object({
                filename: Joi.string().allow(""),
                url: Joi.string()
                    .uri()
                    .required()
            })
        )
        .required(),

    Rules: Joi.string()
        .trim()
        .max(500)
        .allow("")
}).unknown(false);


const EditProfileSchema = Joi.object({
    Name: Joi.string().trim().min(2).max(50).required(),

    Email: Joi.string().email().required(),

    ContactNumber: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .required(),

    Gender: Joi.string()
        .valid("Male", "Female", "Other")
        .required(),

    Proffetion: Joi.string().allow(""),

    About: Joi.string().max(150).allow(""),

    ProfilePic: Joi.string().allow(""),
    ProfilePicPublicId: Joi.string().allow("")
}).unknown(false);


module.exports = {
    UserSchema,
    PostSchema,
    EditProfileSchema
};