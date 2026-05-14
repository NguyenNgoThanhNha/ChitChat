import mongoose from "mongoose";

const blogCommentSchema = new mongoose.Schema(
    {
        post: { type: mongoose.Schema.Types.ObjectId, ref: "BlogPost", required: true, index: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true, maxlength: 2000 },
        parent: { type: mongoose.Schema.Types.ObjectId, ref: "BlogComment", default: null }
    },
    { timestamps: true }
);

const BlogComment = mongoose.model("BlogComment", blogCommentSchema);
export default BlogComment;
