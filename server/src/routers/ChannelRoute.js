import express from 'express';
import { verifyToken } from '../middlewares/AuthMiddleware.js';
import ChannelController from '../controllers/ChannelController.js';

const router = express.Router()

router.get("/get-all-user-channel", verifyToken, ChannelController.GetAllUserChannels)
router.get("/get-channels-messages/:channelId", verifyToken, ChannelController.GetChannelMessages)
router.post("/create", verifyToken, ChannelController.CreateChannel)


export default router;