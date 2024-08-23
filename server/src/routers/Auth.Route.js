import express from 'express';
import AuthController from "../controllers/AuthController.js"
import { verifyToken } from '../middlewares/AuthMiddleware.js';
import multer from 'multer';

const upload = multer({ dest: "upload/profiles/" });

const router = express.Router()
router.get("/get-info", verifyToken, AuthController.GetUserInFo)
router.post("/sign-up", AuthController.SignUp)
router.post("/sign-in", AuthController.SignIn)
router.post("/update-profile", verifyToken, AuthController.UpdateProfile)
router.post("/add-profile-image", verifyToken, upload.single("profile-image"), AuthController.AddProfileImage)
router.delete("/delete-profile-image", verifyToken, upload.single("profile-image"), AuthController.DeleteProfileImage)

export default router;