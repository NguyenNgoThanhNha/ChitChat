import mongoose from "mongoose";

const blockSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    blocked: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

blockSchema.index({ user: 1, blocked: 1 }, { unique: true });
blockSchema.index({ blocked: 1 });

const Block = mongoose.model("Block", blockSchema);
export default Block;
