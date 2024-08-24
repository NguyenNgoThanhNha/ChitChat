import express from 'express';
import ContactController from '../controllers/ContactController.js';
import { verifyToken } from '../middlewares/AuthMiddleware.js';
const router = express.Router()

router.post("/search", verifyToken, ContactController.SearchContacts)

export default router;