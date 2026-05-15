import { useSocketContext } from '@/contexts/SocketContext'
import { apiClient } from '@/lib/api.client'
import { useAppStore } from '@/store/store'
import { UPLOAD_FILE_ROUTE } from '@/utils/constant'
import EmojiPicker from 'emoji-picker-react'
import React, { useEffect, useRef, useState } from 'react'
import { GrAttachment } from "react-icons/gr"
import { IoSend } from 'react-icons/io5'
import { RiEmojiStickerLine } from 'react-icons/ri'
import { IoClose } from "react-icons/io5"
import { useTheme } from "next-themes";

const MessageBar = () => {
    const { resolvedTheme } = useTheme();
    const { selectedChatData, selectedChatType, userInfo, setUploading, setFileUploadProgress, replyToMessage, clearReplyToMessage } = useAppStore();
    const fileInputRef = useRef();
    const socket = useSocketContext();
    const emojiRef = useRef();
    const [message, setMessage] = useState("");
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const typingTimer = useRef(null);
    const lastTypingEmit = useRef(0);

    useEffect(() => {
        function handleClickOutside(event) {
            if (emojiRef.current && !emojiRef.current.contains(event.target)) {
                setEmojiPickerOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [emojiRef])

    const emitTyping = (active) => {
        if (!socket || !selectedChatData?._id || !userInfo?.id) return;
        if (selectedChatType === "contact") {
            socket.emit(active ? "typing" : "typingStop", {
                targetType: "dm",
                targetId: selectedChatData._id,
                userId: userInfo.id
            });
        } else if (selectedChatType === "channel") {
            socket.emit(active ? "typing" : "typingStop", {
                targetType: "channel",
                targetId: selectedChatData._id,
                userId: userInfo.id
            });
        }
    };

    const handleInputChange = (e) => {
        setMessage(e.target.value);
        if (!socket) return;
        const now = Date.now();
        if (now - lastTypingEmit.current > 1200) {
            lastTypingEmit.current = now;
            emitTyping(true);
        }
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => emitTyping(false), 1500);
    };

    const handleAddEmoji = (emoji) => {
        setMessage((msg) => msg + emoji.emoji)
    }

    const handleSendMessage = async () => {
        if (!socket || !message.trim()) return;
        emitTyping(false);
        if (selectedChatType === "contact") {
            socket.emit("sendMessage", {
                sender: userInfo.id,
                content: message,
                recipient: selectedChatData._id,
                messageType: "text",
                fileUrl: undefined,
                replyTo: replyToMessage?._id
            })
        } else if (selectedChatType === "channel") {
            socket.emit("sendMessageChannel", {
                sender: userInfo.id,
                content: message,
                messageType: "text",
                fileUrl: undefined,
                channelId: selectedChatData._id,
                replyTo: replyToMessage?._id
            })
        }
        setMessage("");
        clearReplyToMessage();
    }

    const handleAttachmentClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }

    const handleAttachmentChange = async (event) => {
        try {
            const file = event.target.files[0];

            if (file != null) {
                const formData = new FormData();
                formData.append("file", file);
                setUploading(true)
                const response = await apiClient.post(UPLOAD_FILE_ROUTE, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    withCredentials: true,
                    onUploadProgress: (progressEvent) => {
                        const { loaded, total } = progressEvent;
                        const percentCompleted = Math.round((loaded * 100) / total);
                        setFileUploadProgress(percentCompleted)
                    }
                });
                if (response.status === 200 && response.data) {
                    setUploading(false)
                    if (!socket) return;
                    if (selectedChatType === "contact") {
                        socket.emit("sendMessage", {
                            sender: userInfo.id,
                            content: undefined,
                            recipient: selectedChatData._id,
                            messageType: "file",
                            fileUrl: response.data.filePath,
                            replyTo: replyToMessage?._id
                        });
                    } else if (selectedChatType === "channel") {
                        socket.emit("sendMessageChannel", {
                            sender: userInfo.id,
                            content: undefined,
                            messageType: "file",
                            fileUrl: response.data.filePath,
                            channelId: selectedChatData._id,
                            replyTo: replyToMessage?._id
                        })
                    }
                    clearReplyToMessage();
                } else {
                    console.error("File upload failed", response);
                }
            } else {
                console.error("No file selected");
            }
        } catch (error) {
            setUploading(false)
            console.log(error);
        }
        event.target.value = "";
    };

    return (
        <div className='shrink-0 min-h-[64px] pb-safe bg-chat-surface border-t-2 border-chat-border flex flex-col justify-center px-3 sm:px-6 md:px-10 mb-0 md:mb-2 gap-2 transition-colors duration-300'>
            {replyToMessage && (
                <div className="flex items-center justify-between bg-muted rounded-md px-4 py-2 text-sm text-muted-foreground border border-border animate-in slide-in-from-bottom-2 duration-200">
                    <span>Replying to {replyToMessage.sender?.firstName || replyToMessage.sender?.email || "message"}</span>
                    <button type="button" onClick={clearReplyToMessage} className="p-1 rounded-md hover:bg-muted hover:text-foreground transition-colors"><IoClose /></button>
                </div>
            )}
            <div className='flex justify-center items-center gap-2 sm:gap-4'>
                <div className='flex-1 flex bg-muted rounded-md items-center gap-2 sm:gap-4 pr-2 sm:pr-3 border border-border transition-shadow duration-200 focus-within:ring-1 focus-within:ring-[#8417ff]/40'>
                    <input type='text' className='flex-1 p-3 sm:p-4 md:p-5 bg-transparent rounded-md focus:outline-none text-foreground placeholder:text-muted-foreground text-sm sm:text-base' placeholder='Enter message…' value={message}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSendMessage();
                            }
                        }} />
                    <button type="button" className="text-muted-foreground hover:text-foreground p-2 rounded-md transition-colors duration-200" onClick={handleAttachmentClick}>
                        <GrAttachment className='text-xl' />
                    </button>
                    <input type='file' className='hidden' ref={fileInputRef} name='file' onChange={handleAttachmentChange} />
                    <div className='relative'>
                        <button type="button" className="text-muted-foreground hover:text-foreground p-2 rounded-md transition-colors duration-200"
                            onClick={() => setEmojiPickerOpen(true)}>
                            <RiEmojiStickerLine className='text-xl' />
                        </button>
                        <div className='fixed bottom-[72px] left-2 right-2 z-50 sm:absolute sm:bottom-16 sm:left-auto sm:right-0 sm:w-auto' ref={emojiRef}>
                            <EmojiPicker
                                theme={resolvedTheme === "dark" ? "dark" : "light"}
                                open={emojiPickerOpen}
                                onEmojiClick={handleAddEmoji}
                                autoFocusSearch={false}
                            />
                        </div>
                    </div>
                </div>
                <button type="button" onClick={handleSendMessage} className="rounded-md flex items-center justify-center p-3 sm:p-4 md:p-5 bg-[#8417ff] hover:bg-[#741bda] text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] shrink-0">
                    <IoSend className='text-xl' />
                </button>
            </div>
        </div>
    )
}

export default MessageBar
