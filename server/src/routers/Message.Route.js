import express from 'express';
import { verifyToken } from '../middlewares/AuthMiddleware.js';
import MessageController from '../controllers/MessageController.js';
import multer from "multer";
const router = express.Router()

const upload = multer({ dest: "upload/files/" });

router.post("/get-message", verifyToken, MessageController.GetMessages)
router.post("/upload-file", verifyToken, upload.single("file"), MessageController.UploadFile)

export default router;