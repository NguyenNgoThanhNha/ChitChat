import { useAppStore } from "@/store/store";
import { HOST } from "@/utils/constant";
import { io } from "socket.io-client";
import { createContext, useContext, useEffect, useState } from "react";
import { playMessageSound } from "@/lib/messageSound";

const sid = (a, b) => String(a ?? "") === String(b ?? "");

const SocketContext = createContext(null);

export const useSocketContext = () => useContext(SocketContext);

const notifyIfNeeded = (title, body) => {
    if (typeof document === "undefined" || !document.hidden) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
        new Notification(title, { body, silent: false });
    } catch {
        /* ignore */
    }
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const userInfo = useAppStore((s) => s.userInfo);

    useEffect(() => {
        if (!userInfo?.id) {
            setSocket(null);
            return undefined;
        }

        const s = io(HOST, {
            withCredentials: true,
            query: { userId: userInfo.id },
        });

        setSocket(s);

        const handleRecieveMessage = (message) => {
            const { selectedChatData, selectedChatType, addMessage, addContactsInDMContacts, userInfo: u } = useAppStore.getState();
            const sId = message.sender?._id ?? message.sender;
            const rId = message.recipient?._id ?? message.recipient;
            const isActiveDm = selectedChatType === "contact" && selectedChatData &&
                (sid(selectedChatData._id, sId) || sid(selectedChatData._id, rId));
            if (isActiveDm) {
                addMessage(message);
            }
            addContactsInDMContacts(message);
            const isOwn = sid(sId, u?.id);
            if (!isOwn) {
                if (!isActiveDm || document.hidden) playMessageSound();
                if (!isActiveDm || document.hidden) {
                    const name = message.sender?.firstName || message.sender?.email || "Someone";
                    notifyIfNeeded("New direct message", `${name}: ${message.messageType === "text" ? message.content : "File"}`);
                }
            }
        };

        const handleRecieveMessageChannel = (message) => {
            const { selectedChatData, selectedChatType, addMessage, addChannelInChannelList, userInfo: u } = useAppStore.getState();
            const isActive = selectedChatType === "channel" && sid(selectedChatData?._id, message.channelId);
            if (isActive) {
                addMessage(message);
            }
            addChannelInChannelList(message);
            const isOwn = sid(message.sender?._id ?? message.sender, u?.id);
            if (!isOwn) {
                if (!isActive || document.hidden) playMessageSound();
                if (!isActive || document.hidden) {
                    const name = message.sender?.firstName || message.sender?.email || "Someone";
                    notifyIfNeeded("Channel message", `${name} in channel`);
                }
            }
        };

        const handleDmMessageUpdated = ({ message }) => {
            useAppStore.getState().updateMessageInList(message);
        };

        const handleDmMessageDeleted = ({ messageId }) => {
            useAppStore.getState().markMessageDeleted(messageId);
        };

        const handleChannelMessageUpdated = ({ message }) => {
            const { selectedChatData, selectedChatType, updateMessageInList } = useAppStore.getState();
            if (selectedChatType === "channel" && selectedChatData?._id === message.channel?._id) {
                updateMessageInList(message);
            } else {
                updateMessageInList(message);
            }
        };

        const handleChannelMessageDeleted = ({ messageId }) => {
            useAppStore.getState().markMessageDeleted(messageId);
        };

        const handleOnlineUsers = ({ userIds }) => {
            useAppStore.getState().setOnlineUsers(userIds);
        };

        const handleUserOnline = ({ userId }) => {
            useAppStore.getState().setUserOnline(userId);
        };

        const handleUserOffline = ({ userId }) => {
            useAppStore.getState().setUserOffline(userId);
        };

        const handleTyping = (payload) => {
            const { selectedChatData, selectedChatType, userInfo: u, typingPeers, setTypingPeers } = useAppStore.getState();
            if (!payload?.userId || payload.userId === u?.id) return;
            let relevant = false;
            if (payload.targetType === "dm" && selectedChatType === "contact" && selectedChatData?._id === payload.userId) {
                relevant = true;
            }
            if (payload.targetType === "channel" && selectedChatType === "channel" && selectedChatData?._id === payload.targetId) {
                relevant = true;
            }
            if (!relevant) return;
            const next = [...new Set([...typingPeers, payload.userId])];
            setTypingPeers(next);
        };

        const handleTypingStop = (payload) => {
            const { selectedChatData, selectedChatType, typingPeers, setTypingPeers } = useAppStore.getState();
            if (!payload?.userId) return;
            let relevant = true;
            if (payload.targetType === "dm" && (selectedChatType !== "contact" || selectedChatData?._id !== payload.userId)) {
                relevant = false;
            }
            if (payload.targetType === "channel" && (selectedChatType !== "channel" || selectedChatData?._id !== payload.targetId)) {
                relevant = false;
            }
            if (!relevant) return;
            setTypingPeers(typingPeers.filter((id) => id !== payload.userId));
        };

        const handleReadReceiptUpdated = (payload) => {
            const { selectedChatType, selectedChatData, setDmReadState } = useAppStore.getState();
            if (payload.kind === "dm" && selectedChatType === "contact" && selectedChatData?._id === payload.readerId) {
                setDmReadState({
                    ...useAppStore.getState().dmReadState,
                    theirLastRead: payload.lastReadMessageId
                });
            }
        };

        s.on("recieveMessage", handleRecieveMessage);
        s.on("receiveChannelMessage", handleRecieveMessageChannel);
        s.on("dmMessageUpdated", handleDmMessageUpdated);
        s.on("dmMessageDeleted", handleDmMessageDeleted);
        s.on("channelMessageUpdated", handleChannelMessageUpdated);
        s.on("channelMessageDeleted", handleChannelMessageDeleted);
        s.on("onlineUsers", handleOnlineUsers);
        s.on("userOnline", handleUserOnline);
        s.on("userOffline", handleUserOffline);
        s.on("typing", handleTyping);
        s.on("typingStop", handleTypingStop);
        s.on("readReceiptUpdated", handleReadReceiptUpdated);

        return () => {
            s.removeAllListeners();
            s.disconnect();
            setSocket(null);
        };
    }, [userInfo?.id]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
