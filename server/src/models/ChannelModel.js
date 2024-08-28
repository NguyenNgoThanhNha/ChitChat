import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    members: [{ type: mongoose.Schema.ObjectId, ref: "User", required: true }],
    admin: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
    messages: [{
        type: mongoose.Schema.ObjectId, ref: "Message", required: false
    }],
    createAt: {
        type: Date,
        default: Date.now()
    },
    updateAt: {
        type: Date,
        default: Date.now()
    }
})

channelSchema.pre("save", function (next) {
    this.updateAt = Date.now();
    next();
})

channelSchema.pre("findOneAndUpdate", function (next) {
    this.set({ updateAt: Date.now() });
    next();
})

const Channel = mongoose.model("Channel", channelSchema);
export default Channel