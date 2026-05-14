import mongoose from "mongoose";

const readReceiptSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    kind: { type: String, enum: ["dm", "channel"], required: true },
    contextId: { type: mongoose.Schema.Types.ObjectId, required: true },
    lastReadMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
    updatedAt: { type: Date, default: Date.now }
});

readReceiptSchema.index({ user: 1, kind: 1, contextId: 1 }, { unique: true });

const ReadReceipt = mongoose.model("ReadReceipt", readReceiptSchema);
export default ReadReceipt;
