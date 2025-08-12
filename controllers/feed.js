const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator");
const Post = require("../models/post");
const User = require("../models/user");
const io = require("../socket");

exports.getPosts = async (req, res, next) => {
    const page = req.query.page || 1;
    const limit = 2;
    const skip = (page - 1) * limit;
    const totalItems = await Post.find().countDocuments();

    Post.find()
        .populate("creator", "name")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .then((response) => {
            console.log(req.query.page)
            res.status(200).json({
                page: req.query.page,
                response,
                totalPages: Math.ceil(totalItems / limit),
            });
        })
        .catch((err) => {
            const error = new Error("Fetching Data From Database Failed.");
            error.statusCode = 500;
            next(error);
        });
};

exports.createNewPost = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error(
            "Server validation failed, entered inputs data is incorrect."
        );
        error.statusCode = 422;
        throw error;
    }

    if (!req.file) {
        const error = new Error("File Does not exist.");
        error.statusCode = 422;
        next(error);
    }

    const title = req.body.title;
    const content = req.body.content;
    const creator = req.userId;
    const imageUrl = req.file.path;

    const date = new Date();

    const post = new Post({
        title: title,
        content: content,
        creator,
        imageUrl,
    });
    let seperateName;
    await post
        .save()
        .then(async (newPost) => {
            seperateName = await newPost.populate("creator", "name");
            return User.findById({ _id: req.userId }).then((result) => {
                result.posts.push(newPost._id);
                return result.save();
            });
        })
        .then((user) => {
            // io.getIO().emit("posts", {
            //     action: "create",
            //     post: {
            //         ...post.toObject(),
            //         creator: seperateName.creator.name,
            //     },
            // });

            return res.status(201).json({
                message: "Post created successfully!",
                post: post,
            });
        })
        .catch((err) => {
            const error = new Error("Failed to create post.");
            error.statusCode = 500;
            next(error);
        });
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findOne({ _id: postId })
        .then((response) => {
            return res.status(200).json(response);
        })
        .catch((err) => {
            const error = new Error("Failed to retrieve post.");
            error.statusCode = 500;
            next(error);
        });
};

exports.editItem = (req, res, next) => {
    const postId = req.params.postId;

    Post.findById({ _id: postId })
        .populate("creator", "name")
        .then((post) => {
            post.title = req.body.title;
            post.content = req.body.content;

            if (req.file && req.file.path) {
                post.imageUrl = req.file.path;
            }
            return post.save();
        })
        .then((result) => {
            // io.getIO().emit("posts", {
            //     action: "update",
            //     post: {
            //         ...result.toObject(),
            //         creator: result.creator.name,
            //     },
            // });

            res.status(200).json({
                message: "Item Edited Successfully",
                editedItem: result,
            });
        })
        .catch((err) => {
            const error = new Error("Editing Item Failed.");
            error.statusCode = 500;
            next(error);
        });
};

exports.deleteItem = async (req, res, next) => {
    const postId = req.params.postId;

    const postResult = await Post.findById({ _id: postId }).then((post) => {
        if (!post) {
            const error = new Error("Post not found.");
            error.statusCode = 404;
            throw error;
        }
        return post;
    });

    Post.deleteOne({ _id: postId })
        .then((response) => {
            if (!response) {
                const error = new Error("Post not found.");
                error.statusCode = 404;
                throw error;
            }
            const imagePath = path.join(__dirname, "..", postResult.imageUrl);

            if (!imagePath) {
                return;
            }

            fs.unlink(imagePath, (err) => {
                if (err) {
                    const error = new Error("Deleting Image Failed.");
                    error.statusCode = 404;
                    throw error;
                }
            });
        })
        .then(() => {
            return User.findById(req.userId).then((user) => {
                user.posts.pull(postId);
                return user.save();
            });
        })
        .then(() => {
            io.getIO().emit("posts", {
                action: "delete",
                postId,
            });

            res.status(200).json({ message: "Post deleted successfully." });
        })
        .catch((err) => {
            const error = new Error(err.message);
            error.statusCode = 500;
            next(error);
        });
};

exports.deleteCookie = (req, res, next) => {
    res.clearCookie("tokenn", {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
    });
    return res.status(200).json({ message: "Logged out successfully" });
};
