import React, { useEffect } from 'react'
import ChatHeader from './chat-header/ChatHeader'
import MessageContainer from './message-container/MessageContainer'
import MessageBar from './message-bar/MessageBar'
import { useSocketContext } from '@/contexts/SocketContext'
import { useAppStore } from '@/store/store'


const ChatContainer = () => {
    const socket = useSocketContext();
    const { selectedChatData, selectedChatType, setTypingPeers } = useAppStore();

    useEffect(() => {
        if (!socket || !selectedChatData?._id) return undefined;
        if (selectedChatType === "channel") {
            socket.emit("joinChannelRoom", { channelId: selectedChatData._id });
            return () => {
                socket.emit("leaveChannelRoom", { channelId: selectedChatData._id });
            };
        }
        return undefined;
    }, [socket, selectedChatData?._id, selectedChatType]);

    useEffect(() => {
        setTypingPeers([]);
    }, [selectedChatData?._id, selectedChatType, setTypingPeers]);

    return (
        <div className='fixed top-0 h-[100vh] w-[100vw] bg-chat-surface flex flex-col md:static md:flex-1 md:animate-chat-panel-in border-l border-chat-border transition-colors duration-300'>
            <ChatHeader />
            <MessageContainer />
            <MessageBar />
        </div>
    )
}

export default ChatContainer
