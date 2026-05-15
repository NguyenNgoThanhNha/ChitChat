import { Server as SocketIoServer } from "socket.io"
import Message from "./models/MessageModel.js";
import Channel from "./models/ChannelModel.js";
import { canSendDm } from "./utils/socialGraph.js";

const setupSocket = (server, app) => {
    const io = new SocketIoServer(server, {
        cors: {
            origin: process.env.ORIGIN,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    if (app) {
        app.set("io", io);
    }

    const userSocketMap = new Map();
    const onlineUsers = new Set();
    const voiceRooms = new Map();

    const disconnect = (socket) => {
        for (const [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                onlineUsers.delete(userId);
                io.emit("userOffline", { userId });
                break;
            }
        }
    }

    const sendMessage = async (message) => {
        const senderSocketId = userSocketMap.get(message.sender);
        const recipientSocketId = userSocketMap.get(message.recipient);

        const allowed = await canSendDm(message.sender, message.recipient);
        if (!allowed) {
            if (senderSocketId) {
                io.to(senderSocketId).emit("dmError", {
                    message: "You can only message friends. Send a friend request first."
                });
            }
            return;
        }

        const doc = {
            sender: message.sender,
            recipient: message.recipient,
            content: message.content,
            messageType: message.messageType,
            fileUrl: message.fileUrl,
            replyTo: message.replyTo || undefined
        };

        const createMessage = await Message.create(doc)
        const messageData = await Message.findById(createMessage._id)
            .populate("sender", "id email firstName lastName image color")
            .populate("recipient", "id email firstName lastName image color")
            .populate({
                path: "replyTo",
                select: "content messageType fileUrl sender timestamp isDeleted",
                populate: { path: "sender", select: "firstName lastName email image color" }
            })
            .populate("reactions.user", "firstName lastName email _id image color");

        if (recipientSocketId) {
            io.to(recipientSocketId).emit("recieveMessage", messageData)
        }
        if (senderSocketId) {
            io.to(senderSocketId).emit("recieveMessage", messageData)
        }
    }

    const sendMessageChannel = async (message) => {
        const { channelId, sender, content, messageType, fileUrl, replyTo } = message;
        const createdMessage = await Message.create({
            sender,
            recipient: null,
            channel: channelId,
            replyTo: replyTo || undefined,
            content,
            messageType,
            timestamp: new Date(),
            fileUrl
        });
        const messageData = await Message.findById(createdMessage._id)
            .populate("sender", "id email firstName lastName image color")
            .populate({
                path: "replyTo",
                select: "content messageType fileUrl sender timestamp isDeleted",
                populate: { path: "sender", select: "firstName lastName email image color" }
            })
            .populate("reactions.user", "firstName lastName email _id image color")
            .exec();

        await Channel.findByIdAndUpdate(channelId, {
            $push: { messages: createdMessage._id }
        })
        const channel = await Channel.findById(channelId).populate("members");
        const finalData = { ...messageData._doc, channelId: channel._id };
        if (channel && channel.members) {
            channel.members.forEach((member) => {
                const memberSocketId = userSocketMap.get(member._id.toString());
                if (memberSocketId) {
                    io.to(memberSocketId).emit("receiveChannelMessage", finalData)
                }
            })
            const adminSocketId = userSocketMap.get(channel.admin._id.toString());
            if (adminSocketId) {
                io.to(adminSocketId).emit("receiveChannelMessage", finalData)
            }
        }
    }

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;

        if (userId) {
            userSocketMap.set(userId, socket.id)
            socket.join(`user:${userId}`);
            onlineUsers.add(userId);
            io.emit("userOnline", { userId });
            console.log(`User Connected: ${userId} with socket Id: ${socket.id}`)
        } else {
            console.log("User Id not found during connection")
        }

        socket.emit("onlineUsers", { userIds: [...onlineUsers] });

        socket.on("sendMessage", sendMessage)

        socket.on("sendMessageChannel", sendMessageChannel)

        socket.on("typing", (payload) => {
            const { targetType, targetId, userId: typerId } = payload || {};
            if (!targetType || !targetId || !typerId) return;
            if (targetType === "dm") {
                const sid = userSocketMap.get(targetId);
                if (sid) io.to(sid).emit("typing", { targetType, targetId: typerId, userId: typerId });
            } else if (targetType === "channel") {
                socket.to(`channel:${targetId}`).emit("typing", { targetType, targetId, userId: typerId });
            }
        })

        socket.on("typingStop", (payload) => {
            const { targetType, targetId, userId: typerId } = payload || {};
            if (!targetType || !targetId || !typerId) return;
            if (targetType === "dm") {
                const sid = userSocketMap.get(targetId);
                if (sid) io.to(sid).emit("typingStop", { targetType, userId: typerId });
            } else if (targetType === "channel") {
                socket.to(`channel:${targetId}`).emit("typingStop", { targetType, targetId, userId: typerId });
            }
        })

        socket.on("joinChannelRoom", ({ channelId }) => {
            if (channelId) socket.join(`channel:${channelId}`);
        })

        socket.on("leaveChannelRoom", ({ channelId }) => {
            if (channelId) socket.leave(`channel:${channelId}`);
        })

        socket.on("voice-join", ({ channelId, userId: uid }) => {
            if (!channelId || !uid) return;
            if (!voiceRooms.has(channelId)) voiceRooms.set(channelId, new Set());
            const set = voiceRooms.get(channelId);
            const existing = [...set];
            set.add(uid);
            socket.join(`voice:${channelId}`);
            socket.emit("voice-room-peers", { peers: existing });
            socket.to(`voice:${channelId}`).emit("voice-user-joined", { userId: uid });
        })

        socket.on("voice-leave", ({ channelId, userId: uid }) => {
            if (!channelId || !uid) return;
            voiceRooms.get(channelId)?.delete(uid);
            socket.leave(`voice:${channelId}`);
            socket.to(`voice:${channelId}`).emit("voice-user-left", { userId: uid });
        })

        socket.on("voice-signal", ({ channelId, toUserId, fromUserId, signal }) => {
            const sid = userSocketMap.get(toUserId);
            if (sid) {
                io.to(sid).emit("voice-signal", { fromUserId, signal, channelId });
            }
        })

        socket.on("disconnect", () => disconnect(socket))
    })

    return io;
}
export default setupSocket
