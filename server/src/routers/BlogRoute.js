import express from "express";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import BlogController from "../controllers/BlogController.js";

const router = express.Router();

router.get("/posts", verifyToken, BlogController.ListPosts);
router.post("/posts", verifyToken, BlogController.CreatePost);
router.post("/posts/:id/like", verifyToken, BlogController.ToggleLike);
router.post("/posts/:id/comments", verifyToken, BlogController.AddComment);
router.get("/posts/:id/comments", verifyToken, BlogController.ListComments);
router.post("/posts/:id/share", verifyToken, BlogController.SharePost);
router.delete("/posts/:id", verifyToken, BlogController.DeletePost);

export default router;
