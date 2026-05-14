import mongoose from "mongoose";
import Channel from "../models/ChannelModel.js";
import User from "../models/UserModel.js";
import Message from "../models/MessageModel.js";

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

        const memberRoles = members.map((id) => ({
            user: id,
            role: "member"
        }));

        const newChannel = new Channel({
            name, members, admin: userId, memberRoles
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
        })
            .populate("members", "firstName lastName email image color _id")
            .populate("admin", "firstName lastName email _id")
            .populate("memberRoles.user", "firstName lastName email _id image color")
            .sort({ updateAt: -1 })

        return res.status(200).json({ channels })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" })
    }
}

const SetMemberRole = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { targetUserId, role } = req.body;
        if (!targetUserId || !["moderator", "member"].includes(role)) {
            return res.status(400).json({ message: "targetUserId and role (moderator|member) required" });
        }
        const channel = await Channel.findById(channelId);
        if (!channel) return res.status(404).json({ message: "Channel not found" });
        if (channel.admin.toString() !== req.userId) {
            return res.status(403).json({ message: "Only channel owner can change roles" });
        }
        if (targetUserId === channel.admin.toString()) {
            return res.status(400).json({ message: "Cannot change owner role" });
        }
        const isMember = channel.members.some((m) => m.toString() === targetUserId);
        if (!isMember) {
            return res.status(400).json({ message: "User is not a channel member" });
        }
        const idx = channel.memberRoles.findIndex((r) => r.user.toString() === targetUserId);
        if (idx >= 0) {
            channel.memberRoles[idx].role = role;
        } else {
            channel.memberRoles.push({ user: targetUserId, role });
        }
        await channel.save();
        const updated = await populateChannelDetail(channel._id);
        return res.status(200).json({ channel: updated });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const populateChannelDetail = (channelId) =>
    Channel.findById(channelId)
        .populate("members", "firstName lastName email image color _id")
        .populate("admin", "firstName lastName email _id")
        .populate("memberRoles.user", "firstName lastName email _id image color");

const AddChannelMembers = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { userIds } = req.body;
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: "userIds array required" });
        }
        const channel = await Channel.findById(channelId);
        if (!channel) return res.status(404).json({ message: "Channel not found" });
        if (channel.admin.toString() !== req.userId) {
            return res.status(403).json({ message: "Only channel owner can add members" });
        }
        const adminId = channel.admin.toString();
        const existing = new Set(channel.members.map((m) => m.toString()));
        existing.add(adminId);
        const toAdd = [...new Set(userIds.map((id) => String(id)))].filter((id) => !existing.has(id));
        if (toAdd.length === 0) {
            return res.status(400).json({ message: "No new members to add" });
        }
        const valid = await User.find({ _id: { $in: toAdd } });
        if (valid.length !== toAdd.length) {
            return res.status(400).json({ message: "Some users are invalid" });
        }
        toAdd.forEach((id) => {
            channel.members.push(id);
            channel.memberRoles.push({ user: id, role: "member" });
        });
        await channel.save();
        const updated = await populateChannelDetail(channel._id);
        return res.status(200).json({ channel: updated });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const RemoveChannelMember = async (req, res) => {
    try {
        const { channelId, memberUserId } = req.params;
        if (!memberUserId) {
            return res.status(400).json({ message: "memberUserId required" });
        }
        const channel = await Channel.findById(channelId);
        if (!channel) return res.status(404).json({ message: "Channel not found" });
        if (channel.admin.toString() !== req.userId) {
            return res.status(403).json({ message: "Only channel owner can remove members" });
        }
        if (memberUserId === channel.admin.toString()) {
            return res.status(400).json({ message: "Cannot remove channel owner" });
        }
        const isMember = channel.members.some((m) => m.toString() === memberUserId);
        if (!isMember) {
            return res.status(400).json({ message: "User is not a member" });
        }
        channel.members = channel.members.filter((m) => m.toString() !== memberUserId);
        channel.memberRoles = channel.memberRoles.filter(
            (r) => r.user.toString() !== memberUserId
        );
        await channel.save();
        const updated = await populateChannelDetail(channel._id);
        return res.status(200).json({ channel: updated });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const GetChannelMessages = async (req, res) => {
    try {
        const { channelId } = req.params;
        const channel = await Channel.findById(channelId).populate({
            path: "messages",
            populate: [
                { path: "sender", select: "firstName lastName email _id image color" },
                { path: "recipient", select: "firstName lastName email _id image color" },
                {
                    path: "replyTo",
                    select: "content messageType fileUrl sender timestamp isDeleted",
                    populate: { path: "sender", select: "firstName lastName email _id image color" }
                },
                { path: "reactions.user", select: "firstName lastName email _id image color" }
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

const LeaveChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const channel = await Channel.findById(channelId);
        if (!channel) return res.status(404).json({ message: "Channel not found" });
        const uid = req.userId;
        if (channel.admin.toString() === uid) {
            return res.status(400).json({
                message: "Owner cannot leave. Delete the channel instead."
            });
        }
        const isMember = channel.members.some((m) => m.toString() === uid);
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this channel" });
        }
        channel.members = channel.members.filter((m) => m.toString() !== uid);
        channel.memberRoles = channel.memberRoles.filter((r) => r.user.toString() !== uid);
        await channel.save();
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const DeleteChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const channel = await Channel.findById(channelId);
        if (!channel) return res.status(404).json({ message: "Channel not found" });
        if (channel.admin.toString() !== req.userId) {
            return res.status(403).json({ message: "Only the channel owner can delete it" });
        }
        const msgIds = channel.messages?.length ? channel.messages : [];
        await Message.deleteMany({
            $or: [{ channel: channelId }, { _id: { $in: msgIds } }]
        });
        await Channel.deleteOne({ _id: channelId });
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export default {
    CreateChannel,
    GetAllUserChannels,
    GetChannelMessages,
    SetMemberRole,
    AddChannelMembers,
    RemoveChannelMember,
    LeaveChannel,
    DeleteChannel
};