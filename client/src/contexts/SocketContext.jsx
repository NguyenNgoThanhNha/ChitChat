import { useAppStore } from "@/store/store";
import { HOST } from "@/utils/constant";
import { io } from "socket.io-client";

import { createContext, useContext, useRef, useEffect } from "react";

const SocketContext = createContext(null);

export const useSocketContext = () => {
    return useContext(SocketContext)
}

export const SocketProvider = ({ children }) => {
    const socket = useRef();
    const { userInfo } = useAppStore();

    useEffect(() => {
        if (userInfo) {
            socket.current = io(HOST, {
                withCredentials: true,
                query: { userId: userInfo.id } // socket.handshake.query.userId to server
            });
            socket.current.on("connect", () => {
                console.log("Connected to socket server")
            })

            const handleRecieveMessage = (message) => {
                const { selectedChatData, selectedChatType, addMessage, addContactsInDMContacts } = useAppStore.getState();

                if (selectedChatType !== undefined && (selectedChatData._id === message.sender._id || selectedChatData._id === message.recipient._id)) {
                    console.log("message rcv: ", message)
                    addMessage(message) // add info message
                }
                addContactsInDMContacts(message)
            }

            const handleRecieveMessageChannel = (message) => {
                const { selectedChatData, selectedChatType, addMessage, addChannelInChannelList } = useAppStore.getState();
                if (selectedChatType !== undefined && selectedChatData._id === message.channelId) {
                    addMessage(message)
                }
                addChannelInChannelList(message)
            }

            socket.current.on("recieveMessage", handleRecieveMessage)
            socket.current.on("receiveChannelMessage", handleRecieveMessageChannel)

            return () => {
                socket.current.disconnect();
            }
        }
    }, [userInfo])

    return (
        <SocketContext.Provider value={socket.current}>
            {children}
        </SocketContext.Provider>
    )
}