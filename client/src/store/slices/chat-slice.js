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

        setSelectedChatType: (selectedChatType) => set({ selectedChatType }),
        setSelectedChatData: (selectedChatData) => set({ selectedChatData }),
        setselectedChatMessages: (selectedChatMessages) => set({ selectedChatMessages }),
        setDirectMessagesContacts: (directMessagesContacts) => set({ directMessagesContacts }),


        setUploading: (isUploading) => set({ isUploading }),
        setDownLoading: (isDownLoading) => set({ isDownLoading }),
        setFileUploadProgress: (fileUploadProgress) => set({ fileUploadProgress }),
        setFileDownloadProgress: (fileDownloadProgress) => set({ fileDownloadProgress }),


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
        }
    }
)