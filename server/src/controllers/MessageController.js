import Message from './../models/MessageModel.js';
import ReadReceipt from './../models/ReadReceiptModel.js';
import Channel from './../models/ChannelModel.js';
import { mkdirSync, renameSync } from 'fs'
import mongoose from 'mongoose';
import { canModerateMessages } from '../utils/channelPermissions.js';
import { foldSearchText, queryMatchesFoldedHaystack } from "../utils/textSearch.js";

const emitUsers = (io, userIds, event, data) => {
    if (!io) return;
    [...new Set(userIds)].forEach((uid) => io.to(`user:${uid}`).emit(event, data));
};

const emitChannelMemberIds = async (io, channelId, event, data) => {
    if (!io) return;
    const ch = await Channel.findById(channelId).select("members admin");
    if (!ch) return;
    const ids = [...ch.members.map((m) => m.toString()), ch.admin.toString()];
    emitUsers(io, ids, event, data);
};

const populateMessage = [
    { path: "sender", select: "id email firstName lastName image color" },
    { path: "recipient", select: "id email firstName lastName image color" },
    {
        path: "replyTo",
        select: "content messageType fileUrl sender timestamp isDeleted",
        populate: { path: "sender", select: "firstName lastName email image color" }
    },
    { path: "reactions.user", select: "firstName lastName email _id image color" }
];

const DEFAULT_MSG_LIMIT = 50;
const MAX_MSG_LIMIT = 100;

const parseMessagePagination = (req) => {
    const limit = Math.min(
        MAX_MSG_LIMIT,
        Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_MSG_LIMIT)
    );
    const before = req.query.before;
    return { limit, before };
};

const GetMessages = async (req, res) => {
    try {
        const user1 = req.userId;
        const user2 = req.body.id;

        if (!user1 || !user2) {
            return res.status(400).json({ error: "Both user IDs are required." });
        }

        const { limit, before } = parseMessagePagination(req);
        const filter = {
            $or: [
                { sender: user1, recipient: user2 },
                { sender: user2, recipient: user1 }
            ]
        };

        if (before && mongoose.Types.ObjectId.isValid(before)) {
            const anchor = await Message.findById(before).select("timestamp");
            if (anchor) filter.timestamp = { $lt: anchor.timestamp };
        }

        const batch = await Message.find(filter)
            .sort({ timestamp: -1 })
            .limit(limit + 1)
            .populate(populateMessage);

        const hasMore = batch.length > limit;
        const slice = hasMore ? batch.slice(0, limit) : batch;
        const messages = slice.reverse();

        return res.status(200).json({ messages, hasMore });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const UploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "File is required." });
        }
        const date = Date.now();
        const safeName = req.file.originalname.replace(/[^\w.\- ()\[\]]+/g, "_");
        const fileDir = `upload/files/${date}`;
        const fileName = `${fileDir}/${safeName}`;
        mkdirSync(fileDir, { recursive: true });

        renameSync(req.file.path, fileName);
        return res.status(200).json({ filePath: fileName });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const UpdateMessage = async (req, res) => {
    try {
        const { messageId, content } = req.body;
        if (!messageId || content === undefined) {
            return res.status(400).json({ message: "messageId and content required" });
        }
        const msg = await Message.findById(messageId);
        if (!msg || msg.isDeleted) {
            return res.status(404).json({ message: "Message not found" });
        }
        if (msg.sender.toString() !== req.userId) {
            return res.status(403).json({ message: "Not allowed" });
        }
        if (msg.messageType !== "text") {
            return res.status(400).json({ message: "Only text messages can be edited" });
        }
        msg.content = content;
        msg.editedAt = new Date();
        await msg.save();
        const updated = await Message.findById(msg._id).populate(populateMessage);
        const io = req.app.get("io");
        if (msg.channel) {
            await emitChannelMemberIds(io, msg.channel.toString(), "channelMessageUpdated", { message: updated });
        } else if (msg.recipient) {
            emitUsers(io, [msg.sender.toString(), msg.recipient.toString()], "dmMessageUpdated", { message: updated });
        }
        return res.status(200).json({ message: updated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const DeleteMessage = async (req, res) => {
    try {
        const { messageId } = req.body;
        if (!messageId) return res.status(400).json({ message: "messageId required" });

        const msg = await Message.findById(messageId);
        if (!msg) return res.status(404).json({ message: "Message not found" });

        const isOwner = msg.sender.toString() === req.userId;
        let allowed = isOwner;

        if (msg.channel) {
            const channel = await Channel.findById(msg.channel);
            if (!channel) return res.status(404).json({ message: "Channel not found" });
            if (!isOwner && canModerateMessages(channel, req.userId)) {
                allowed = true;
            }
        }

        if (!allowed) {
            return res.status(403).json({ message: "Not allowed" });
        }

        msg.isDeleted = true;
        msg.content = undefined;
        msg.fileUrl = undefined;
        await msg.save();
        const io = req.app.get("io");
        if (msg.channel) {
            await emitChannelMemberIds(io, msg.channel.toString(), "channelMessageDeleted", { messageId: msg._id });
        } else if (msg.recipient) {
            emitUsers(io, [msg.sender.toString(), msg.recipient.toString()], "dmMessageDeleted", { messageId: msg._id });
        }
        return res.status(200).json({ messageId: msg._id });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const ToggleReaction = async (req, res) => {
    try {
        const { messageId, emoji } = req.body;
        if (!messageId || !emoji) {
            return res.status(400).json({ message: "messageId and emoji required" });
        }
        const msg = await Message.findById(messageId);
        if (!msg || msg.isDeleted) {
            return res.status(404).json({ message: "Message not found" });
        }

        const uid = new mongoose.Types.ObjectId(req.userId);
        const idx = msg.reactions.findIndex(
            (r) => r.user.equals(uid) && r.emoji === emoji
        );
        if (idx >= 0) {
            msg.reactions.splice(idx, 1);
        } else {
            msg.reactions.push({ user: uid, emoji });
        }
        await msg.save();
        const updated = await Message.findById(msg._id).populate(populateMessage);
        const io = req.app.get("io");
        if (msg.channel) {
            await emitChannelMemberIds(io, msg.channel.toString(), "channelMessageUpdated", { message: updated });
        } else if (msg.recipient) {
            emitUsers(io, [msg.sender.toString(), msg.recipient.toString()], "dmMessageUpdated", { message: updated });
        }
        return res.status(200).json({ message: updated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const SEARCH_SCAN_LIMIT = 4000;
const SEARCH_RESULT_LIMIT = 50;

const SearchMessages = async (req, res) => {
    try {
        const q = (req.query.q || "").trim();
        if (!q) {
            return res.status(400).json({ message: "Query is required" });
        }
        const foldedQ = foldSearchText(q);
        if (!foldedQ) {
            return res.status(400).json({ message: "Invalid query" });
        }

        const collectMatches = async (scopeFilter) => {
            const candidates = await Message.find({
                isDeleted: false,
                ...scopeFilter
            })
                .select("content fileUrl messageType")
                .sort({ timestamp: -1 })
                .limit(SEARCH_SCAN_LIMIT)
                .lean();

            const ids = [];
            for (const m of candidates) {
                if (!queryMatchesFoldedHaystack(m, foldedQ)) continue;
                ids.push(m._id);
                if (ids.length >= SEARCH_RESULT_LIMIT) break;
            }
            if (!ids.length) return [];
            const populated = await Message.find({ _id: { $in: ids } })
                .populate(populateMessage)
                .lean();
            const byId = new Map(populated.map((doc) => [String(doc._id), doc]));
            return ids.map((id) => byId.get(String(id))).filter(Boolean);
        };

        if (req.query.channelId) {
            if (!mongoose.Types.ObjectId.isValid(req.query.channelId)) {
                return res.status(400).json({ message: "Invalid channel id" });
            }
            const channelOid = new mongoose.Types.ObjectId(req.query.channelId);
            const channel = await Channel.findById(channelOid).select("messages members admin");
            if (!channel) return res.status(404).json({ message: "Channel not found" });
            const ok = channel.admin.toString() === req.userId ||
                channel.members.some((m) => m.toString() === req.userId);
            if (!ok) return res.status(403).json({ message: "Not a member" });

            const msgIds = channel.messages?.length ? channel.messages : [];
            const scopeFilter = {
                $or: [
                    { channel: channelOid },
                    { _id: { $in: msgIds } }
                ]
            };

            const messages = await collectMatches(scopeFilter);
            return res.status(200).json({ messages });
        }

        if (req.query.dmPeerId) {
            if (!mongoose.Types.ObjectId.isValid(req.query.dmPeerId)) {
                return res.status(400).json({ message: "Invalid peer id" });
            }
            const peerOid = new mongoose.Types.ObjectId(req.query.dmPeerId);
            const scopeFilter = {
                $or: [
                    { sender: req.userId, recipient: peerOid },
                    { sender: peerOid, recipient: req.userId }
                ]
            };
            const messages = await collectMatches(scopeFilter);
            return res.status(200).json({ messages });
        }

        return res.status(400).json({ message: "channelId or dmPeerId required" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const MarkRead = async (req, res) => {
    try {
        const { kind, contextId, lastReadMessageId } = req.body;
        if (!kind || !contextId || !lastReadMessageId) {
            return res.status(400).json({ message: "kind, contextId, lastReadMessageId required" });
        }

        if (kind === "channel") {
            const channel = await Channel.findById(contextId);
            if (!channel) return res.status(404).json({ message: "Channel not found" });
            const ok = channel.admin.toString() === req.userId ||
                channel.members.some((m) => m.toString() === req.userId);
            if (!ok) return res.status(403).json({ message: "Not a member" });
        } else if (kind === "dm") {
            if (contextId === req.userId) {
                return res.status(400).json({ message: "Invalid peer" });
            }
        } else {
            return res.status(400).json({ message: "kind must be dm or channel" });
        }

        await ReadReceipt.findOneAndUpdate(
            {
                user: req.userId,
                kind,
                contextId
            },
            {
                lastReadMessage: lastReadMessageId,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        const io = req.app.get("io");
        if (kind === "dm") {
            io.to(`user:${contextId}`).emit("readReceiptUpdated", {
                kind,
                readerId: req.userId,
                lastReadMessageId
            });
        } else if (kind === "channel") {
            await emitChannelMemberIds(io, contextId, "readReceiptUpdated", {
                kind,
                readerId: req.userId,
                lastReadMessageId,
                contextId
            });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const GetReadState = async (req, res) => {
    try {
        const { kind, contextId } = req.query;
        if (!kind || !contextId) {
            return res.status(400).json({ message: "kind and contextId required" });
        }

        if (kind === "dm") {
            const mine = await ReadReceipt.findOne({
                user: req.userId,
                kind: "dm",
                contextId
            }).lean();
            const theirs = await ReadReceipt.findOne({
                user: contextId,
                kind: "dm",
                contextId: req.userId
            }).lean();
            return res.status(200).json({
                myLastRead: mine?.lastReadMessage || null,
                theirLastRead: theirs?.lastReadMessage || null
            });
        }

        if (kind === "channel") {
            const channel = await Channel.findById(contextId);
            if (!channel) return res.status(404).json({ message: "Channel not found" });
            const rows = await ReadReceipt.find({ kind: "channel", contextId }).lean();
            return res.status(200).json({ receipts: rows });
        }

        return res.status(400).json({ message: "Invalid kind" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export default {
    GetMessages,
    UploadFile,
    UpdateMessage,
    DeleteMessage,
    ToggleReaction,
    SearchMessages,
    MarkRead,
    GetReadState
};
