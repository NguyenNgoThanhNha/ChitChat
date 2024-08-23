import express from 'express';
import AuthRouter from "../routers/Auth.Route.js"
const router = express.Router()

router.use("/auth", AuthRouter)

export default router;