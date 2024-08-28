export const createChatSlice = (set, get) => (
    {
        selectedChatType: undefined,
        selectedChatData: undefined, // who user choose
        selectedChatMessages: [], // Message between two users
        directMessagesContacts: [], // GET_CONTACT_FOR_Direct Message of User

        isUploading: false,
        isDownLoading: false,
        fileUploadProgress: 0,
        fileDownloadProgress: 0,

        channels: [],

        setSelectedChatType: (selectedChatType) => set({ selectedChatType }),
        setSelectedChatData: (selectedChatData) => set({ selectedChatData }),
        setselectedChatMessages: (selectedChatMessages) => set({ selectedChatMessages }),
        setDirectMessagesContacts: (directMessagesContacts) => set({ directMessagesContacts }),


        setUploading: (isUploading) => set({ isUploading }),
        setDownLoading: (isDownLoading) => set({ isDownLoading }),
        setFileUploadProgress: (fileUploadProgress) => set({ fileUploadProgress }),
        setFileDownloadProgress: (fileDownloadProgress) => set({ fileDownloadProgress }),

        setChannels: (channels) => set({ channels }),

        closeChat: () => set({ selectedChatData: undefined, selectedChatType: undefined, selectedChatMessages: [] }),

        addMessage: (message) => {
            const selectedChatMessages = get().selectedChatMessages;
            const selectedChatType = get().selectedChatType;

            set({
                selectedChatMessages: [
                    ...selectedChatMessages, {
                        ...message,
                        recipient: selectedChatType === "channel" ? message.recipient : message.recipient._id,
                        sender: selectedChatType === "channel" ? message.sender : message.sender._id
                    }
                ]
            })
        },

        addChannel: (channel) => {
            const channels = get().channels;
            set({ channels: [channel, ...channels] })
        },

        addChannelInChannelList: (message) => {
            const channels = get().channels;
            const data = channels.find((channel) => channel._id === message.channelId);
            const index = channels.findIndex(
                (channel) => channel._id === message.channelId
            );
            console.log("1111", data)
            console.log("2222", index)
            if (index !== -1 && index !== undefined) {
                channels.splice(index, 1);
                channels.unshift(data)
            }
        },

        addContactsInDMContacts: (message) => {
            const userId = get().userInfo.id;
            const fromId = message.sender._id === userId
                ? message.recipient._id
                : message.sender._id

            const fromData = message.sender._id === userId ? message.recipient : message.senderl
            const dmContacts = get().directMessagesContacts;
            const data = dmContacts.find((contact) => contact._id === fromId);
            const index = dmContacts.findIndex((contact) => contact._id === fromId);
            if (index !== -1 && index !== undefined) {
                dmContacts.splice(index, 1);
                dmContacts.unshift(data);
            } else {
                dmContacts.unshift(data);
            }
            set({ directMessagesContacts: dmContacts })
        }
    }
)