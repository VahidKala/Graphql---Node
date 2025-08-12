const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const path = require("path");
const { default: mongoose } = require("mongoose");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const isAuth = require("./middleware/is-auth");

const app = express();

app.use(express.json());

app.use(cookieParser());

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(
            null,
            Math.random().toString(36).substring(2, 12) +
                "-" +
                file.originalname
        );
    },
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single("imageUrl")
);

app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.put("/post-image", (req, res, next) => {
    res.status(200).json({ message: "File saved!", filePath: req.file.path });
});

app.use(
    "/graphql",
    graphqlHTTP((req, res) => ({
        schema: require("./graphql/schema"),
        rootValue: require("./graphql/resolver"),
        graphiql: true,
        context: { req, res },
        customFormatErrorFn(err) {
            if (!err.originalError) {
                return err;
            }
            const message = err.message;
            const statusCode = err.originalError.statusCode || 500;
            const data = err.originalError.data;

            return { message, statusCode, data };
        },
    }))
);

app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;
    const errorData = error.data || null;
    res.status(status).json({
        errorData,
        message: message,
    });
});

mongoose
    .connect(
        "mongodb..."
    )
    .then(() => {
        app.listen(8080);
    })
    .catch((err) => {
        console.error("Database connection failed:", err);
    });
