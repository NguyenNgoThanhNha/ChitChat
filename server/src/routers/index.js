import express from 'express';
import AuthRouter from "../routers/Auth.Route.js"
import ContactRouter from "../routers/Contact.Route.js"
import MessageRouter from "../routers/Message.Route.js"
import ChannelRouter from "../routers/ChannelRoute.js"
import BlogRouter from "../routers/BlogRoute.js"
import ShopRouter from "../routers/ShopRoute.js"
const router = express.Router()

router.use("/auth", AuthRouter)
router.use("/contact", ContactRouter)
router.use("/message", MessageRouter)
router.use("/channel", ChannelRouter)
router.use("/blog", BlogRouter)
router.use("/shop", ShopRouter)

export default router;