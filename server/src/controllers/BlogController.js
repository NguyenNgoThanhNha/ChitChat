import mongoose from "mongoose";
import BlogPost from "../models/BlogPostModel.js";
import BlogComment from "../models/BlogCommentModel.js";

const authorSelect = "firstName lastName email image color";

const ListPosts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(30, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            BlogPost.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("author", authorSelect)
                .lean(),
            BlogPost.countDocuments()
        ]);

        const uid = req.userId ? String(req.userId) : null;
        const list = posts.map((p) => ({
            ...p,
            likedByMe: uid ? (p.likes || []).some((id) => String(id) === uid) : false,
            likesCount: (p.likes || []).length
        }));

        return res.status(200).json({ posts: list, total, page, limit });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const pickPaths = (arr, max) =>
    (Array.isArray(arr) ? arr.filter((x) => typeof x === "string" && x.trim()) : []).slice(0, max);

const CreatePost = async (req, res) => {
    try {
        const { content, images, videos, files } = req.body;
        const imgs = pickPaths(images, 8);
        const vids = pickPaths(videos, 6);
        const docs = pickPaths(files, 8);
        const text = String(content || "").trim();
        if (!text && !imgs.length && !vids.length && !docs.length) {
            return res.status(400).json({ message: "Cần nội dung hoặc ít nhất một ảnh / video / file." });
        }
        const post = await BlogPost.create({
            author: req.userId,
            content: text,
            images: imgs,
            videos: vids,
            files: docs
        });
        const populated = await BlogPost.findById(post._id).populate("author", authorSelect);
        return res.status(201).json({ post: populated });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const ToggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await BlogPost.findById(id);
        if (!post) return res.status(404).json({ message: "Post not found" });
        const uid = new mongoose.Types.ObjectId(req.userId);
        const idx = post.likes.findIndex((x) => x.equals(uid));
        if (idx >= 0) post.likes.splice(idx, 1);
        else post.likes.push(uid);
        await post.save();
        const updated = await BlogPost.findById(id).populate("author", authorSelect);
        return res.status(200).json({
            post: updated,
            liked: idx < 0,
            likesCount: updated.likes.length
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const AddComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, parentId } = req.body;
        if (!content || !String(content).trim()) {
            return res.status(400).json({ message: "Content is required" });
        }
        const post = await BlogPost.findById(id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const comment = await BlogComment.create({
            post: id,
            author: req.userId,
            content: String(content).trim(),
            parent: parentId || null
        });
        post.commentsCount = (post.commentsCount || 0) + 1;
        await post.save();

        const populated = await BlogComment.findById(comment._id)
            .populate("author", authorSelect)
            .populate("parent");
        return res.status(201).json({ comment: populated });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const ListComments = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await BlogPost.findById(id);
        if (!post) return res.status(404).json({ message: "Post not found" });
        const comments = await BlogComment.find({ post: id })
            .sort({ createdAt: 1 })
            .populate("author", authorSelect);
        return res.status(200).json({ comments });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const SharePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await BlogPost.findByIdAndUpdate(
            id,
            { $inc: { sharesCount: 1 } },
            { new: true }
        ).populate("author", authorSelect);
        if (!post) return res.status(404).json({ message: "Post not found" });
        const origin = process.env.ORIGIN || "";
        const shareUrl = `${origin}/blog?post=${id}`;
        return res.status(200).json({ post, shareUrl });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const DeletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await BlogPost.findById(id);
        if (!post) return res.status(404).json({ message: "Post not found" });
        if (post.author.toString() !== req.userId) {
            return res.status(403).json({ message: "Not allowed" });
        }
        await BlogComment.deleteMany({ post: id });
        await BlogPost.deleteOne({ _id: id });
        return res.status(200).json({ ok: true });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export default {
    ListPosts,
    CreatePost,
    ToggleLike,
    AddComment,
    ListComments,
    SharePost,
    DeletePost
};
