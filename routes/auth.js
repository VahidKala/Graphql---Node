// const express = require("express");
// const authControllers = require("../controllers/auth");
// const { check } = require("express-validator");
// const User = require("../models/user");

// const router = express.Router();

// router.put(
//     "/signup",
//     [
//         check("email")
//             .isEmail()
//             .withMessage("Please enter a valid email.")
//             .custom((value, { req }) => {
//                 return User.findOne({ email: value }).then((result) => {
//                     if (result) {
//                         return Promise.reject("E-mail is already exist.");
//                     }
//                 });
//             })
//             .normalizeEmail(),
//         check("password")
//             .trim()
//             .isLength({ min: 5 })
//             .custom((value, { req }) => {
//                 if (value === req.body.email) {
//                     throw new Error("E-mail and password must be different.");
//                 }
//                 return true;
//             }),
//         check("name").trim().not().isEmpty(),
//     ],
//     authControllers.signup
// );

// router.post("/login", authControllers.login);

// module.exports = router;
