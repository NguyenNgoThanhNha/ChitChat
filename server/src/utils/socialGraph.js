import mongoose from "mongoose";
import FriendRequest from "../models/FriendRequestModel.js";
import Block from "../models/BlockModel.js";

const oid = (id) => new mongoose.Types.ObjectId(id);

export const getBlockedUserIds = async (userId) => {
    const uid = oid(userId);
    const [blockedByMe, blockedMe] = await Promise.all([
        Block.find({ user: uid }).select("blocked").lean(),
        Block.find({ blocked: uid }).select("user").lean()
    ]);
    const set = new Set();
    blockedByMe.forEach((r) => set.add(String(r.blocked)));
    blockedMe.forEach((r) => set.add(String(r.user)));
    return set;
};

export const isBlocked = async (userA, userB) => {
    if (!userA || !userB || String(userA) === String(userB)) return false;
    const row = await Block.findOne({
        $or: [
            { user: userA, blocked: userB },
            { user: userB, blocked: userA }
        ]
    }).lean();
    return !!row;
};

export const areFriends = async (userA, userB) => {
    if (!userA || !userB || String(userA) === String(userB)) return false;
    const fr = await FriendRequest.findOne({
        status: "accepted",
        $or: [
            { from: userA, to: userB },
            { from: userB, to: userA }
        ]
    }).lean();
    return !!fr;
};

export const canSendDm = async (senderId, recipientId) => {
    if (await isBlocked(senderId, recipientId)) return false;
    return areFriends(senderId, recipientId);
};

export const getRelation = async (viewerId, otherId) => {
    if (String(viewerId) === String(otherId)) return "self";
    if (await isBlocked(viewerId, otherId)) return "blocked";

    const pending = await FriendRequest.findOne({
        status: "pending",
        $or: [
            { from: viewerId, to: otherId },
            { from: otherId, to: viewerId }
        ]
    }).lean();

    if (pending) {
        return String(pending.from) === String(viewerId) ? "pending_sent" : "pending_received";
    }

    if (await areFriends(viewerId, otherId)) return "friends";
    return "none";
};

export const getFriendIds = async (userId) => {
    const accepted = await FriendRequest.find({
        status: "accepted",
        $or: [{ from: userId }, { to: userId }]
    }).lean();
    const set = new Set();
    accepted.forEach((f) => {
        const other = String(f.from) === String(userId) ? String(f.to) : String(f.from);
        set.add(other);
    });
    return set;
};

export const attachRelations = async (viewerId, users) => {
    if (!users?.length) return [];
    const ids = users.map((u) => u._id);
    const blocked = await getBlockedUserIds(viewerId);

    const [pending, accepted] = await Promise.all([
        FriendRequest.find({
            status: "pending",
            $or: [
                { from: viewerId, to: { $in: ids } },
                { from: { $in: ids }, to: viewerId }
            ]
        }).lean(),
        FriendRequest.find({
            status: "accepted",
            $or: [
                { from: viewerId, to: { $in: ids } },
                { from: { $in: ids }, to: viewerId }
            ]
        }).lean()
    ]);

    const pendingMap = new Map();
    pending.forEach((p) => {
        const other = String(p.from) === String(viewerId) ? String(p.to) : String(p.from);
        pendingMap.set(other, String(p.from) === String(viewerId) ? "pending_sent" : "pending_received");
    });

    const friendSet = new Set();
    accepted.forEach((f) => {
        const other = String(f.from) === String(viewerId) ? String(f.to) : String(f.from);
        friendSet.add(other);
    });

    return users
        .filter((u) => !blocked.has(String(u._id)))
        .map((u) => {
            const id = String(u._id);
            let relation = "none";
            if (pendingMap.has(id)) relation = pendingMap.get(id);
            else if (friendSet.has(id)) relation = "friends";
            return { ...u.toObject?.() ?? u, relation };
        });
};
