import { useAppStore } from '@/store/store'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ContactContainer from './contact-container/ContactContainer';
import EmptyChatContainer from './empty-chat-container/EmptyChatContainer';
import ChatContainer from './chat-container/ChatContainer';

const Chat = () => {
    const navigate = useNavigate();
    const { userInfo, selectedChatType, isDownLoading, isUploading, fileUploadProgress, fileDownloadProgress } = useAppStore();
    useEffect(() => {
        if (!userInfo.profileSetup) {
            toast.info("Please setup profile to continue.");
            navigate("/profile")
        }
    }, [userInfo, navigate])

    return (
        <>
            <div className='flex h-[100vh] text-white overflow-hidden'>
                {
                    isUploading && (
                        <div className='h-[100vh] w-[100vw] fixed top-0 z-10 left-0 bg-black/80 flex items-center justify-center flex-col gap-5 backdrop-blur-lg'>
                            <h5 className='text-5xl animate-pulse'>
                                Uploading File
                            </h5>
                            {fileUploadProgress}%
                        </div>
                    )
                }
                {
                    isDownLoading && (
                        <div className='h-[100vh] w-[100vw] fixed top-0 z-10 left-0 bg-black/80 flex items-center justify-center flex-col gap-5 backdrop-blur-lg'>
                            <h5 className='text-5xl animate-pulse'>
                                Downloading File
                            </h5>
                            {fileDownloadProgress}%
                        </div>
                    )
                }
                <ContactContainer />
                {
                    selectedChatType === undefined ? <EmptyChatContainer /> : <ChatContainer />
                }
            </div>
        </>
    )
}

export default Chat