import express from 'express';
import { verifyToken } from '../middlewares/AuthMiddleware.js';
import MessageController from '../controllers/MessageController.js';
import multer from "multer";
const router = express.Router()

const upload = multer({ dest: "upload/files/" });

router.post("/get-message", verifyToken, MessageController.GetMessages)
router.post("/upload-file", verifyToken, upload.single("file"), MessageController.UploadFile)
router.patch("/edit", verifyToken, MessageController.UpdateMessage)
router.delete("/delete", verifyToken, MessageController.DeleteMessage)
router.post("/react", verifyToken, MessageController.ToggleReaction)
router.get("/search", verifyToken, MessageController.SearchMessages)
router.post("/mark-read", verifyToken, MessageController.MarkRead)
router.get("/read-state", verifyToken, MessageController.GetReadState)

export default router;