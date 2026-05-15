import express from 'express';
import ContactController from '../controllers/ContactController.js';
import SocialController from '../controllers/SocialController.js';
import { verifyToken } from '../middlewares/AuthMiddleware.js';
const router = express.Router()

router.post("/search", verifyToken, ContactController.SearchContacts)
router.get("/get-contacts-for-dm", verifyToken, ContactController.GetContactsForDirectMessagesList)
router.get("/get-all-contact", verifyToken, ContactController.GetAllContact)

router.post("/friend-request", verifyToken, SocialController.SendFriendRequest)
router.patch("/friend-request/:requestId", verifyToken, SocialController.RespondFriendRequest)
router.delete("/friend-request/:requestId", verifyToken, SocialController.CancelFriendRequest)
router.delete("/friends/:userId", verifyToken, SocialController.RemoveFriend)
router.get("/friend-requests/incoming", verifyToken, SocialController.ListIncomingRequests)
router.get("/friend-requests/outgoing", verifyToken, SocialController.ListOutgoingRequests)
router.get("/friends", verifyToken, SocialController.ListFriends)
router.get("/relation/:userId", verifyToken, SocialController.GetRelationStatus)

router.post("/block", verifyToken, SocialController.BlockUser)
router.delete("/block/:userId", verifyToken, SocialController.UnblockUser)
router.get("/blocked", verifyToken, SocialController.ListBlocked)

export default router;