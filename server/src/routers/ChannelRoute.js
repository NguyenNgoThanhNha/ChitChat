import express from 'express';
import { verifyToken } from '../middlewares/AuthMiddleware.js';
import ChannelController from '../controllers/ChannelController.js';

const router = express.Router()

router.get("/get-all-user-channel", verifyToken, ChannelController.GetAllUserChannels)
router.get("/get-channels-messages/:channelId", verifyToken, ChannelController.GetChannelMessages)
router.post("/create", verifyToken, ChannelController.CreateChannel)
router.patch("/:channelId/member-role", verifyToken, ChannelController.SetMemberRole)
router.post("/:channelId/members", verifyToken, ChannelController.AddChannelMembers)
router.delete("/:channelId/members/:memberUserId", verifyToken, ChannelController.RemoveChannelMember)
router.post("/:channelId/leave", verifyToken, ChannelController.LeaveChannel)
router.delete("/:channelId", verifyToken, ChannelController.DeleteChannel)


export default router;