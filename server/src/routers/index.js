import express from 'express';
import AuthRouter from "../routers/Auth.Route.js"
import ContactRouter from "../routers/Contact.Route.js"
import MessageRouter from "../routers/Message.Route.js"
import ChannelRouter from "../routers/ChannelRoute.js"
const router = express.Router()

router.use("/auth", AuthRouter)
router.use("/contact", ContactRouter)
router.use("/message", MessageRouter)
router.use("/channel", ChannelRouter)

export default router;