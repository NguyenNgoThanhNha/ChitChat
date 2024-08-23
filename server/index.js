import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import router from "./src/routers/index.js"
dotenv.config();

mongoose.connect(process.env.DATABASE_URL).then(() => {
    console.log("Db Connected")
})

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
    origin: [process.env.ORIGIN],
    credentials: true
}))

app.use("/upload/profiles", express.static("upload/profiles"))

app.use(cookieParser());
app.use(express.json());

app.use("/api", router)

app.listen(port, () => {
    console.log(`Server is running at localhost:${port}`)
})