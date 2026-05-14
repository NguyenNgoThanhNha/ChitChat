import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema(
    {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, default: "", maxlength: 8000 },
        images: { type: [String], default: [] },
        videos: { type: [String], default: [] },
        files: { type: [String], default: [] },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        sharesCount: { type: Number, default: 0 },
        commentsCount: { type: Number, default: 0 }
    },
    { timestamps: true }
);

blogPostSchema.index({ createdAt: -1 });

const BlogPost = mongoose.model("BlogPost", blogPostSchema);
export default BlogPost;
