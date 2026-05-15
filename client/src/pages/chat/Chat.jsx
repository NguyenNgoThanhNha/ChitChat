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
            <div className='flex h-[100dvh] text-foreground bg-chat-surface overflow-hidden animate-chat-fade'>
                {
                    isUploading && (
                        <div className='h-[100vh] w-[100vw] fixed top-0 z-10 left-0 bg-background/80 dark:bg-black/80 flex items-center justify-center flex-col gap-5 backdrop-blur-md animate-in fade-in duration-200'>
                            <h5 className='text-2xl md:text-4xl font-medium animate-pulse text-foreground'>
                                Uploading File
                            </h5>
                            <div className="w-48 h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-[#8417ff] transition-all duration-300 rounded-full"
                                    style={{ width: `${fileUploadProgress}%` }}
                                />
                            </div>
                            <span className="text-muted-foreground">{fileUploadProgress}%</span>
                        </div>
                    )
                }
                {
                    isDownLoading && (
                        <div className='h-[100vh] w-[100vw] fixed top-0 z-10 left-0 bg-background/80 dark:bg-black/80 flex items-center justify-center flex-col gap-5 backdrop-blur-md animate-in fade-in duration-200'>
                            <h5 className='text-2xl md:text-4xl font-medium animate-pulse text-foreground'>
                                Downloading File
                            </h5>
                            <div className="w-48 h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-[#8417ff] transition-all duration-300 rounded-full"
                                    style={{ width: `${fileDownloadProgress}%` }}
                                />
                            </div>
                            <span className="text-muted-foreground">{fileDownloadProgress}%</span>
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
