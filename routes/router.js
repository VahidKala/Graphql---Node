// const express = require("express");
// const feedControllers = require("../controllers/feed");
// const { check } = require("express-validator");
// const isAuth = require("../middleware/is-auth");

// const router = express.Router();

// router.get("/get-items", isAuth, feedControllers.getPosts);

// router.post(
//     "/post-items",
//     [
//         check("title").trim().isLength({ min: 4 }),
//         check("content").trim().isLength({ min: 4 }),
//     ],
//     isAuth,
//     feedControllers.createNewPost
// );

// router.post("/post/:postId", isAuth, feedControllers.getPost);

// router.put(
//     "/edit-item/:postId",
//     [
//         check("title").trim().isLength({ min: 4 }),
//         check("content").trim().isLength({ min: 4 }),
//     ],
//     isAuth,
//     feedControllers.editItem
// );

// router.delete("/deleteItem/:postId", isAuth, feedControllers.deleteItem);

// router.post("/logout", isAuth, feedControllers.deleteCookie);

// module.exports = router;
