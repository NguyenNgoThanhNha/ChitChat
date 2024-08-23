import express from 'express';
import AuthController from "../controllers/AuthController.js"
import { verifyToken } from '../middlewares/AuthMiddleware.js';
const router = express.Router()

router.get("/get-info", verifyToken, AuthController.GetUserInFo)
router.post("/sign-up", AuthController.SignUp)
router.post("/sign-in", AuthController.SignIn)
router.post("/update-profile", verifyToken, AuthController.UpdateProfile)

export default router;