import express from 'express';
import { verifyToken } from '../middlewares/AuthMiddleware.js';
import MessageController from '../controllers/MessageController.js';

const router = express.Router()

router.post("/get-message", verifyToken, MessageController.GetMessages)

export default router;