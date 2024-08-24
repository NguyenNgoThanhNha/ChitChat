import express from 'express';
import ContactController from '../controllers/ContactController.js';
import { verifyToken } from '../middlewares/AuthMiddleware.js';
const router = express.Router()

router.post("/search", verifyToken, ContactController.SearchContacts)
router.get("/get-contacts-for-dm", verifyToken, ContactController.GetContactsForDirectMessagesList)

export default router;