const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error("Validation Falied.");
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

    bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
            const user = new User({
                email,
                password: hashedPassword,
                name,
            });
            return user.save();
        })
        .then((result) => {
            res.status(201).json({
                message: "User Created Successfully.",
                result,
            });
        })
        .catch((err) => {
            if (err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let user;

    User.findOne({ email })
        .then((foundedUser) => {
            if (!foundedUser) {
                const error = new Error("User with this email not found!");
                error.statusCode = 401;
                throw error;
            }
            user = foundedUser;
            return bcrypt.compare(password, foundedUser.password);
        })
        .then((isEqual) => {
            if (!isEqual) {
                const error = new Error("Password is wrong!");
                error.statusCode = 401;
                throw error;
            }
            const token = jwt.sign(
                {
                    email: user.email,
                    userId: user._id.toString(),
                    ua: req.headers["user-agent"],
                    ip: req.ip,
                },
                "somesecuresecretkeysecretkey",
                {
                    expiresIn: "30m",
                }
            );

            res.cookie("tokenn", token, {
                httpOnly: true,
                secure: true,
                sameSite: "Strict",
                maxAge: 1800 * 1000,
            });

            User.findById(req.userId).then((user) => {});

            res.status(200).json({ token, userId: user._id.toString() });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};
