import mongoose from "mongoose";
import User from "../models/UserModel.js";
import FriendRequest from "../models/FriendRequestModel.js";
import Block from "../models/BlockModel.js";
import {
    areFriends,
    getBlockedUserIds,
    getFriendIds,
    getRelation,
    isBlocked
} from "../utils/socialGraph.js";

const userSelect = "firstName lastName email image color _id";

const SendFriendRequest = async (req, res) => {
    try {
        const { toUserId } = req.body;
        if (!toUserId || !mongoose.Types.ObjectId.isValid(toUserId)) {
            return res.status(400).json({ message: "Valid toUserId required" });
        }
        if (toUserId === req.userId) {
            return res.status(400).json({ message: "Cannot add yourself" });
        }

        const target = await User.findById(toUserId);
        if (!target) return res.status(404).json({ message: "User not found" });

        if (await isBlocked(req.userId, toUserId)) {
            return res.status(403).json({ message: "Cannot send request to this user" });
        }
        if (await areFriends(req.userId, toUserId)) {
            return res.status(400).json({ message: "Already friends" });
        }

        const existing = await FriendRequest.findOne({
            $or: [
                { from: req.userId, to: toUserId },
                { from: toUserId, to: req.userId }
            ]
        });

        if (existing) {
            if (existing.status === "pending") {
                if (String(existing.from) === req.userId) {
                    return res.status(400).json({ message: "Friend request already sent" });
                }
                return res.status(400).json({ message: "This user already sent you a request" });
            }
            if (existing.status === "accepted") {
                return res.status(400).json({ message: "Already friends" });
            }
            existing.from = req.userId;
            existing.to = toUserId;
            existing.status = "pending";
            await existing.save();
            const populated = await FriendRequest.findById(existing._id)
                .populate("from", userSelect)
                .populate("to", userSelect);
            return res.status(200).json({ request: populated });
        }

        const request = await FriendRequest.create({
            from: req.userId,
            to: toUserId,
            status: "pending"
        });
        const populated = await FriendRequest.findById(request._id)
            .populate("from", userSelect)
            .populate("to", userSelect);
        return res.status(201).json({ request: populated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const RespondFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action } = req.body;
        if (!["accept", "reject"].includes(action)) {
            return res.status(400).json({ message: "action must be accept or reject" });
        }

        const request = await FriendRequest.findById(requestId);
        if (!request || request.status !== "pending") {
            return res.status(404).json({ message: "Request not found" });
        }
        if (String(request.to) !== req.userId) {
            return res.status(403).json({ message: "Not allowed" });
        }
        if (await isBlocked(req.userId, request.from)) {
            return res.status(403).json({ message: "Cannot accept this request" });
        }

        request.status = action === "accept" ? "accepted" : "rejected";
        await request.save();

        const populated = await FriendRequest.findById(request._id)
            .populate("from", userSelect)
            .populate("to", userSelect);
        return res.status(200).json({ request: populated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const CancelFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await FriendRequest.findById(requestId);
        if (!request || request.status !== "pending") {
            return res.status(404).json({ message: "Request not found" });
        }
        if (String(request.from) !== req.userId) {
            return res.status(403).json({ message: "Not allowed" });
        }
        await FriendRequest.deleteOne({ _id: requestId });
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const RemoveFriend = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user id" });
        }
        await FriendRequest.deleteMany({
            status: "accepted",
            $or: [
                { from: req.userId, to: userId },
                { from: userId, to: req.userId }
            ]
        });
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const ListIncomingRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.find({ to: req.userId, status: "pending" })
            .sort({ createdAt: -1 })
            .populate("from", userSelect)
            .populate("to", userSelect);
        return res.status(200).json({ requests });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const ListOutgoingRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.find({ from: req.userId, status: "pending" })
            .sort({ createdAt: -1 })
            .populate("from", userSelect)
            .populate("to", userSelect);
        return res.status(200).json({ requests });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const ListFriends = async (req, res) => {
    try {
        const friendIds = await getFriendIds(req.userId);
        const blocked = await getBlockedUserIds(req.userId);
        const ids = [...friendIds].filter((id) => !blocked.has(id));
        const friends = await User.find({ _id: { $in: ids } }).select(userSelect).lean();
        return res.status(200).json({ friends });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const BlockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Valid userId required" });
        }
        if (userId === req.userId) {
            return res.status(400).json({ message: "Cannot block yourself" });
        }
        const target = await User.findById(userId);
        if (!target) return res.status(404).json({ message: "User not found" });

        await Block.findOneAndUpdate(
            { user: req.userId, blocked: userId },
            {},
            { upsert: true, new: true }
        );

        await FriendRequest.deleteMany({
            $or: [
                { from: req.userId, to: userId },
                { from: userId, to: req.userId }
            ]
        });

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const UnblockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        await Block.deleteOne({ user: req.userId, blocked: userId });
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const ListBlocked = async (req, res) => {
    try {
        const rows = await Block.find({ user: req.userId }).populate("blocked", userSelect).lean();
        const users = rows.map((r) => r.blocked).filter(Boolean);
        return res.status(200).json({ blocked: users });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const GetRelationStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const relation = await getRelation(req.userId, userId);
        return res.status(200).json({ relation });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export default {
    SendFriendRequest,
    RespondFriendRequest,
    CancelFriendRequest,
    RemoveFriend,
    ListIncomingRequests,
    ListOutgoingRequests,
    ListFriends,
    BlockUser,
    UnblockUser,
    ListBlocked,
    GetRelationStatus
};
