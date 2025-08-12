const fs = require("fs");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const path = require("path");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const Post = require("../models/post");
const { use } = require("react");

const resolver = {
    createUser: async function ({ userInputs }, { req, res }) {
        const errors = [];

        if (!validator.isEmail(userInputs.email)) {
            errors.push({ maeesage: "Invalid email!" });
        }

        if (
            validator.isEmpty(userInputs.password) ||
            !validator.isLength(userInputs.password, { min: 5 })
        ) {
            errors.push({ maeesage: "Enter correct password!" });
        }

        if (errors.length !== 0) {
            const error = new Error("invalid inputs!");
            error.data = errors;
            error.statusCode = 422;

            throw error;
        }

        const newUser = await User.findOne({ email: userInputs.email });
        if (newUser) {
            const error = new Error("This email is belong to another user!");
            error.data = "E-mail is exist already!";
            throw error;
        }

        const hashedPw = await bcrypt.hash(userInputs.password, 12);

        const user = new User({
            email: userInputs.email,
            password: hashedPw,
            name: userInputs.name,
        });

        const createdUserToDb = await user.save();

        return {
            ...createdUserToDb._doc,
            _id: createdUserToDb._id.toString(),
        };
    },

    loginUser: async function ({ userInputs }, { req, res }) {
        const errors = [];

        if (!validator.isEmail(userInputs.email)) {
            errors.push({ maeesage: "Invalid email!" });
        }

        if (
            validator.isEmpty(userInputs.password) ||
            !validator.isLength(userInputs.password, { min: 5 })
        ) {
            errors.push({ maeesage: "Enter correct password!" });
        }

        if (errors.length !== 0) {
            const error = new Error("invalid inputs!");
            error.data = errors;
            error.statusCode = 422;

            throw error;
        }

        const email = userInputs.email;
        const password = userInputs.password;
        let user;

        return User.findOne({ email })
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
                    secure: false,
                    sameSite: "Strict",
                    maxAge: 1800 * 1000,
                });

                return {
                    token,
                    userId: user._id.toString(),
                };
            })
            .catch((err) => {
                if (!err.statusCode) {
                    err.statusCode = 500;
                }
                throw err;
            });
    },

    getItems: async function ({ userInputs }, { req, res }) {
        const token = req.cookies.tokenn;

        if (!token) {
            const error = new Error("Invalid Token!");
            error.statusCode = 422;
            throw error;
        }

        const verifiedToken = jwt.verify(token, "somesecuresecretkeysecretkey");

        if (!verifiedToken) {
            const error = new Error("Validation Failed!");
            error.statusCode = 401;
            throw error;
        }

        if (
            verifiedToken.ua !== req.headers["user-agent"] ||
            verifiedToken.ip !== req.ip
        ) {
            const error = new Error("Validation Failed!");
            error.statusCode = 401;
            error.data = "Please Login First!";
            throw error;
        }

        req.userId = verifiedToken.userId;

        const page = userInputs.pageNum || 1;
        const limit = 2;
        const skip = (page - 1) * limit;
        const totalItems = await Post.find().countDocuments();

        return Post.find()
            .populate("creator", "name")
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .then(async (response) => {
                const totalPages = await Math.ceil(totalItems / limit);
                if (response.length === 0) {
                    return [];
                }
                if (response.length === 1) {
                    return [
                        {
                            _id: response[0]._id.toString(),
                            title: response[0].title,
                            content: response[0].content,
                            creator: response[0].creator,
                            imageUrl: response[0].imageUrl,
                            createdAt: response[0].createdAt.toISOString(),
                            totalPages: totalPages,
                        },
                    ];
                }

                return [
                    {
                        _id: response[0]._id.toString(),
                        title: response[0].title,
                        content: response[0].content,
                        creator: response[0].creator,
                        imageUrl: response[0].imageUrl,
                        createdAt: response[0].createdAt.toISOString(),
                        totalPages: totalPages,
                    },
                    {
                        _id: response[1]._id.toString(),
                        title: response[1].title,
                        content: response[1].content,
                        creator: response[1].creator,
                        imageUrl: response[1].imageUrl,
                        createdAt: response[1].createdAt.toISOString(),
                        totalPages: totalPages,
                    },
                ];
            })
            .catch((err) => {
                const error = new Error("Fetching Data From Database Failed.");
                error.statusCode = 500;
                throw error;
            });
    },

    postItems: async function ({ postInputs }, { req, res }) {
        const token = req.cookies.tokenn;
        const verifiedToken = await jwt.verify(
            token,
            "somesecuresecretkeysecretkey"
        );

        const userPostThisItem = await User.findById(verifiedToken.userId);
        const post = new Post({
            title: postInputs.title,
            content: postInputs.content,
            creator: verifiedToken.userId,
            imageUrl: postInputs.imageUrl,
        });

        const savedPost = await post.save();
        userPostThisItem.posts.push(savedPost);
        await userPostThisItem.save();

        return {
            _id: savedPost._id.toString(),
            title: savedPost.title,
            content: savedPost.content,
            imageUrl: savedPost.imageUrl,
            creator: {
                name: userPostThisItem.name,
                _id: userPostThisItem._id.toString(),
            },
            createdAt: savedPost.createdAt.toISOString(),
            updatedAt: savedPost.updatedAt.toISOString(),
        };
    },

    editItem: async function ({ userInputs }, { req, res }) {
        const postId = userInputs.postId;

        return Post.findById(postId)
            .populate("creator", "name")
            .then((post) => {
                post.title = userInputs.title;
                post.content = userInputs.content;

                if (userInputs.imageUrl) {
                    post.imageUrl = userInputs.imageUrl;
                }
                return post.save();
            })
            .then((result) => {
                return {
                    _id: postId,
                    title: result.title,
                    content: result.content,
                    imageUrl: result.imageUrl,
                };
            })
            .catch((err) => {
                const error = new Error("Editing Item Failed.");
                error.statusCode = 500;
                throw error;
            });
    },

    deleteItem: async function ({ postId }, { req, res }) {
        const token = req.cookies.tokenn;

        if (!token) {
            const error = new Error("Invalid Token!");
            error.statusCode = 422;
            throw error;
        }

        const verifiedToken = jwt.verify(token, "somesecuresecretkeysecretkey");

        if (!verifiedToken) {
            const error = new Error("Validation Failed!");
            error.statusCode = 401;
            throw error;
        }

        if (
            verifiedToken.ua !== req.headers["user-agent"] ||
            verifiedToken.ip !== req.ip
        ) {
            const error = new Error("Validation Failed!");
            error.statusCode = 401;
            error.data = "Please Login First!";
            throw error;
        }

        req.userId = verifiedToken.userId;

        const postResult = await Post.findById({ _id: postId.itemId }).then(
            (post) => {
                if (!post) {
                    const error = new Error("Post not found.");
                    error.statusCode = 404;
                    throw error;
                }
                return post;
            }
        );

        const unlinkAsync = (path) => {
            return new Promise((resolve, reject) => {
                fs.unlink(path, (err) => {
                    if (err) {
                        return reject(new Error("Deleting Image Failed."));
                    }
                    resolve();
                });
            });
        };

        return Post.deleteOne({ _id: postId.itemId })
            .then((response) => {
                if (!response) {
                    const error = new Error("Post not found.");
                    error.statusCode = 404;
                    throw error;
                }
                const imagePath = path.join(
                    __dirname,
                    "..",
                    postResult.imageUrl
                );
                if (!imagePath) {
                    return;
                }

                return unlinkAsync(imagePath);
            })
            .then((res) => {
                return User.findById(req.userId).then((user) => {
                    user.posts.pull(postId.itemId);
                    return user.save();
                });
            })
            .then(() => {
                return { message: "Item Deleted Successfully!" };
            })
            .catch((err) => {
                const error = new Error(err.message);
                error.data = err.message;
                throw error;
            });
    },

    viewDetails: async function ({ viewItemId }, { req, res }) {
        const item = await Post.findById(viewItemId.itemId).then((response) => {
            return response;
        });
        return {
            title: item.title,
            content: item.content,
            imageUrl: item.imageUrl,
        };
    },

    logoutUser: async function ({}, { req, res }) {
        res.clearCookie("tokenn", {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
        });
        return { trueOrFalse: true };
    },
};

module.exports = resolver;
