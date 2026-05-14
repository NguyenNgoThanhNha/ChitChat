import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true }
}, { _id: false });

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel",
        required: false
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        required: false
    },
    messageType: {
        type: String,
        enum: ["text", "file"],
        require: true
    },
    content: {
        type: String,
        required: function () {
            return this.messageType === "text" && !this.isDeleted
        }
    },
    fileUrl: {
        type: String,
        required: function () {
            return this.messageType === "file" && !this.isDeleted
        }
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    editedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    reactions: { type: [reactionSchema], default: [] }
})

messageSchema.index({ channel: 1, timestamp: -1 });
messageSchema.index({ sender: 1, recipient: 1, timestamp: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;