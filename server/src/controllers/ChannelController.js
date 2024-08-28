import mongoose from "mongoose";
import Channel from "../models/ChannelModel.js";
import User from "../models/UserModel.js";

const CreateChannel = async (req, res) => {
    try {
        const { name, members } = req.body;
        const userId = req.userId;
        const admin = await User.findById(userId);
        if (!admin) {
            return res.status(400).json({ message: "Admin User Not Found." })
        }

        const validMember = await User.find({ _id: { $in: members } })

        if (validMember.length !== members.length) {
            return res.status(400).json({ message: "Some member are not valid users." })
        }

        const newChannel = new Channel({
            name, members, admin: userId
        })

        await newChannel.save();

        return res.status(201).json({ channel: newChannel })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" })
    }
}

const GetAllUserChannels = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.userId);
        const channels = await Channel.find({
            $or: [{ admin: userId }, { members: userId }]
        }).sort({ updateAt: -1 })

        return res.status(200).json({ channels })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" })
    }
}

const GetChannelMessages = async (req, res) => {
    try {
        const { channelId } = req.params;
        const channel = await Channel.findById(channelId).populate({
            path: "messages",
            populate: [
                { path: "sender", select: "firstName lastName email _id image color" },
                { path: "recipient", select: "firstName lastName email _id image color" }
            ]
        });

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        const messages = channel.messages;
        return res.status(200).json({ messages });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export default {
    CreateChannel,
    GetAllUserChannels,
    GetChannelMessages
}