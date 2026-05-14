import mongoose from "mongoose";

export const resolveChannelRole = (channel, userId) => {
    const uid = userId?.toString?.() ?? userId;
    if (channel.admin?.toString() === uid) return "admin";
    const row = channel.memberRoles?.find((r) => r.user?.toString() === uid);
    return row?.role || "member";
};

export const canManageChannel = (channel, userId) =>
    resolveChannelRole(channel, userId) === "admin";

export const canModerateMessages = (channel, userId) => {
    const r = resolveChannelRole(channel, userId);
    return r === "admin" || r === "moderator";
};

export const toObjectId = (id) => new mongoose.Types.ObjectId(id);
