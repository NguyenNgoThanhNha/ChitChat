import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import router from "./src/routers/index.js"
import setupSocket from "./src/socket.js";
import { getAllowedOrigins } from "./src/utils/jwtCookieOptions.js";
dotenv.config();

mongoose.connect(process.env.DATABASE_URL).then(() => {
    console.log("Db Connected")
})

const app = express();
const port = process.env.PORT || 3001;

app.set("trust proxy", 1);

const allowedOrigins = getAllowedOrigins();

app.use(cors({
    origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
    },
    credentials: true
}))

app.use("/upload/profiles", express.static("upload/profiles")) // profile 
app.use("/upload/files", express.static("upload/files")) // chat
app.use("/upload/products", express.static("upload/products")) // shop

app.use(cookieParser());
app.use(express.json());

app.use("/api", router)

const server = app.listen(port, () => {
    console.log(`Server is running at localhost:${port}`)
})

setupSocket(server, app);

// module.exports = { app };