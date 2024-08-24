import express from 'express';
import AuthRouter from "../routers/Auth.Route.js"
import ContactRouter from "../routers/Contact.Route.js"
const router = express.Router()

router.use("/auth", AuthRouter)
router.use("/contact", ContactRouter)

export default router;