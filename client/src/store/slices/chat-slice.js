import { saveActiveChat } from "../chatPersistence.js";

export const createChatSlice = (set, get) => (
    {
        selectedChatType: undefined,
        selectedChatData: undefined,
        selectedChatMessages: [],
        directMessagesContacts: [],

        isUploading: false,
        isDownLoading: false,
        fileUploadProgress: 0,
        fileDownloadProgress: 0,

        channels: [],

        onlineUserIds: {},
        typingPeers: [],
        replyToMessage: null,
        dmReadState: { myLastRead: null, theirLastRead: null },
        channelReadReceipts: [],
        hasMoreMessages: false,
        loadingOlderMessages: false,
        searchOpen: false,
        highlightMessageId: null,

        setSelectedChatType: (selectedChatType) => set({ selectedChatType }),
        setSelectedChatData: (selectedChatData) => set({ selectedChatData }),
        setselectedChatMessages: (selectedChatMessages) => set({ selectedChatMessages }),
        setDirectMessagesContacts: (directMessagesContacts) => set({ directMessagesContacts }),

        setUploading: (isUploading) => set({ isUploading }),
        setDownLoading: (isDownLoading) => set({ isDownLoading }),
        setFileUploadProgress: (fileUploadProgress) => set({ fileUploadProgress }),
        setFileDownloadProgress: (fileDownloadProgress) => set({ fileDownloadProgress }),

        setChannels: (channels) => set({ channels }),

        setOnlineUsers: (userIds) => {
            const o = {};
            (userIds || []).forEach((id) => { o[id] = true; });
            set({ onlineUserIds: o });
        },
        setUserOnline: (userId) => set((s) => ({ onlineUserIds: { ...s.onlineUserIds, [userId]: true } })),
        setUserOffline: (userId) => set((s) => {
            const next = { ...s.onlineUserIds };
            delete next[userId];
            return { onlineUserIds: next };
        }),

        setTypingPeers: (typingPeers) => set({ typingPeers }),
        setReplyToMessage: (replyToMessage) => set({ replyToMessage }),
        clearReplyToMessage: () => set({ replyToMessage: null }),
        setDmReadState: (dmReadState) => set((state) => ({
            dmReadState: typeof dmReadState === "function" ? dmReadState(state.dmReadState) : dmReadState
        })),
        setChannelReadReceipts: (channelReadReceipts) => set((state) => ({
            channelReadReceipts:
                typeof channelReadReceipts === "function"
                    ? channelReadReceipts(state.channelReadReceipts)
                    : channelReadReceipts
        })),
        setHasMoreMessages: (hasMoreMessages) => set({ hasMoreMessages }),
        setLoadingOlderMessages: (loadingOlderMessages) => set({ loadingOlderMessages }),
        prependMessages: (olderMessages) => set({
            selectedChatMessages: [...olderMessages, ...get().selectedChatMessages]
        }),
        setSearchOpen: (searchOpen) => set({ searchOpen }),
        setHighlightMessageId: (highlightMessageId) => set({ highlightMessageId }),

        closeChat: () => {
            saveActiveChat(null, null);
            set({
                selectedChatData: undefined,
                selectedChatType: undefined,
                selectedChatMessages: [],
                typingPeers: [],
                replyToMessage: null,
                dmReadState: { myLastRead: null, theirLastRead: null },
                channelReadReceipts: [],
                hasMoreMessages: false,
                loadingOlderMessages: false,
                highlightMessageId: null
            });
        },

        addMessage: (message) => {
            const selectedChatMessages = get().selectedChatMessages;
            const selectedChatType = get().selectedChatType;

            const normalized = {
                ...message,
                recipient: selectedChatType === "channel"
                    ? message.recipient
                    : (message.recipient?._id ?? message.recipient),
                sender: selectedChatType === "channel"
                    ? message.sender
                    : (message.sender?._id ?? message.sender)
            };

            set({
                selectedChatMessages: [...selectedChatMessages, normalized]
            });
        },

        updateMessageInList: (message) => {
            const id = message._id?.toString?.() ?? message._id;
            set({
                selectedChatMessages: get().selectedChatMessages.map((m) =>
                    (m._id?.toString?.() ?? m._id) === id ? { ...m, ...message } : m
                )
            });
        },

        markMessageDeleted: (messageId) => {
            const id = messageId?.toString?.() ?? messageId;
            set({
                selectedChatMessages: get().selectedChatMessages.map((m) =>
                    (m._id?.toString?.() ?? m._id) === id
                        ? { ...m, isDeleted: true, content: undefined, fileUrl: undefined }
                        : m
                )
            });
        },

        addChannel: (channel) => {
            const channels = get().channels;
            set({ channels: [channel, ...channels] })
        },

        addChannelInChannelList: (message) => {
            const channels = [...get().channels];
            const data = channels.find((channel) => channel._id === message.channelId);
            const index = channels.findIndex(
                (channel) => channel._id === message.channelId
            );
            if (index !== -1 && index !== undefined && data) {
                channels.splice(index, 1);
                channels.unshift(data)
                set({ channels })
            }
        },

        addContactsInDMContacts: (message) => {
            const userId = get().userInfo.id;
            const fromId = message.sender._id === userId
                ? message.recipient._id
                : message.sender._id

            const fromData = message.sender._id === userId ? message.recipient : message.sender;
            const dmContacts = [...get().directMessagesContacts];
            const data = dmContacts.find((contact) => contact._id === fromId);
            const index = dmContacts.findIndex((contact) => contact._id === fromId);
            if (index !== -1 && index !== undefined && data) {
                dmContacts.splice(index, 1);
                dmContacts.unshift(data);
            } else if (fromData) {
                dmContacts.unshift(fromData);
            }
            set({ directMessagesContacts: dmContacts })
        },

        updateChannelMemberRole: (channelId, targetUserId, role) => {
                const patch = (ch) => {
                if (String(ch._id) !== String(channelId)) return ch;
                const memberRoles = [...(ch.memberRoles || [])];
                const i = memberRoles.findIndex((r) => r.user?._id === targetUserId || r.user === targetUserId);
                if (i >= 0) memberRoles[i] = { ...memberRoles[i], role };
                else memberRoles.push({ user: { _id: targetUserId }, role });
                return { ...ch, memberRoles };
            };
            set((s) => {
                const channels = s.channels.map(patch);
                const selectedChatData =
                    s.selectedChatType === "channel" && String(s.selectedChatData?._id) === String(channelId)
                        ? patch(s.selectedChatData)
                        : s.selectedChatData;
                return { channels, selectedChatData };
            });
        },

        syncChannelFromServer: (channel) => {
            const id = String(channel._id);
            set((s) => {
                const channels = s.channels.map((c) => (String(c._id) === id ? { ...c, ...channel } : c));
                const selectedChatData =
                    s.selectedChatType === "channel" && s.selectedChatData && String(s.selectedChatData._id) === id
                        ? { ...s.selectedChatData, ...channel }
                        : s.selectedChatData;
                return { channels, selectedChatData };
            });
        },

        removeChannelFromList: (channelId) => {
            const id = String(channelId);
            set((s) => {
                const channels = s.channels.filter((c) => String(c._id) !== id);
                const close =
                    s.selectedChatType === "channel" && s.selectedChatData && String(s.selectedChatData._id) === id;
                if (close) saveActiveChat(null, null);
                return {
                    channels,
                    ...(close
                        ? {
                              selectedChatData: undefined,
                              selectedChatType: undefined,
                              selectedChatMessages: [],
                              typingPeers: [],
                              replyToMessage: null,
                              dmReadState: { myLastRead: null, theirLastRead: null },
                              channelReadReceipts: [],
                              hasMoreMessages: false,
                              loadingOlderMessages: false,
                              highlightMessageId: null
                          }
                        : {})
                };
            });
        }
    }
)
