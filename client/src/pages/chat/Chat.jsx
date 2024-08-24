import { useAppStore } from '@/store/store'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ContactContainer from './contact-container/ContactContainer';
import EmptyChatContainer from './empty-chat-container/EmptyChatContainer';
import ChatContainer from './chat-container/ChatContainer';

const Chat = () => {
    const navigate = useNavigate();
    const { userInfo, selectedChatType } = useAppStore();
    useEffect(() => {
        if (!userInfo.profileSetup) {
            toast.info("Please setup profile to continue.");
            navigate("/profile")
        }
    }, [userInfo, navigate])

    return (
        <>
            <div className='flex h-[100vh] text-white overflow-hidden'>
                <ContactContainer />
                {
                    selectedChatType === undefined ? <EmptyChatContainer /> : <ChatContainer />
                }
            </div>
        </>
    )
}

export default Chat