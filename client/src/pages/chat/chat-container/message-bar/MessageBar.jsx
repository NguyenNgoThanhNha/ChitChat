import { useSocketContext } from '@/contexts/SocketContext'
import { apiClient } from '@/lib/api.client'
import { useAppStore } from '@/store/store'
import { UPLOAD_FILE_ROUTE } from '@/utils/constant'
import { data } from 'autoprefixer'
import EmojiPicker from 'emoji-picker-react'
import React, { useEffect, useRef, useState } from 'react'
import { GrAttachment } from "react-icons/gr"
import { IoSend } from 'react-icons/io5'
import { RiEmojiStickerLine } from 'react-icons/ri'
const MessageBar = () => {
    const { selectedChatData, selectedChatType, userInfo, setUploading, setFileUploadProgress } = useAppStore();
    const fileInputRef = useRef();
    const socket = useSocketContext();
    const emojiRef = useRef();
    const [message, setMessage] = useState("");
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

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

    const handleAddEmoji = (emoji) => {
        setMessage((msg) => msg + emoji.emoji)
    }

    const handleSendMessage = async () => {
        if (selectedChatType === "contact") {
            socket.emit("sendMessage", {
                sender: userInfo.id,
                content: message,
                recipient: selectedChatData._id,
                messageType: "text",
                fileUrl: undefined
            })
        } else if (selectedChatType === "channel") {
            socket.emit("sendMessageChannel", {
                sender: userInfo.id,
                content: message,
                messageType: "text",
                fileUrl: undefined,
                channelId: selectedChatData._id
            })
        }
        setMessage("");
    }

    const handleAttachmentClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }

    const handleAttachmentChange = async (event) => {
        try {
            const file = event.target.files[0]; // Get the selected file
            console.log(file);

            if (file != null) {
                const formData = new FormData();
                formData.append("file", file); // Append the file to the FormData object
                setUploading(true)
                const response = await apiClient.post(UPLOAD_FILE_ROUTE, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }, // need to add in order to use form data
                    withCredentials: true,
                    onUploadProgress: (progressEvent) => {
                        const { loaded, total } = progressEvent;
                        const percentCompleted = Math.round((loaded * 100) / total);
                        setFileUploadProgress(percentCompleted)
                    }
                });
                if (response.status === 200 && response.data) {
                    setUploading(false)
                    if (selectedChatType === "contact") {
                        socket.emit("sendMessage", {
                            sender: userInfo.id,
                            content: undefined,
                            recipient: selectedChatData._id,
                            messageType: "file",
                            fileUrl: response.data.filePath // The file path returned from the server
                        });
                    } else if (selectedChatType === "channel") {
                        socket.emit("sendMessageChannel", {
                            sender: userInfo.id,
                            content: undefined,
                            messageType: "file",
                            fileUrl: response.data.filePath,
                            channelId: selectedChatData._id
                        })
                    }
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
    };

    return (
        <div className='h-[10vh] bg-[#1c1d25] flex justify-center items-center px-8 mb-6 gap-6'>
            <div className='flex-1 flex bg-[#2a2b33] round-md items-center gap-5 pr-5'>
                <input type='text' className='flex-1 p-5 bg-transparent rounded-md focus:border-none focus:outline-none' placeholder='Enter Message' value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSendMessage();
                        }
                    }} />
                <button className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all" onClick={handleAttachmentClick}>
                    <GrAttachment className='text-2xl' />
                </button>
                <input type='file' className='hidden' ref={fileInputRef} name='file' onChange={handleAttachmentChange} />
                <div className='relative'>
                    <button className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all"
                        onClick={() => setEmojiPickerOpen(true)}>
                        <RiEmojiStickerLine className='text-2xl' />
                    </button>
                    <div className='absolute bottom-16 right-0' ref={emojiRef}>
                        <EmojiPicker
                            theme='dark'
                            open={emojiPickerOpen}
                            onEmojiClick={handleAddEmoji}
                            autoFocusSearch={false}
                        />
                    </div>
                </div>
            </div>
            <button onClick={handleSendMessage} className="bg-[#8417ff] hover:bg-[#741bda] rounded-md flex items-center justify-center p-5 gap-2 focus:border-none focus:bg-[#741bda] focus:outline-none focus:text-white duration-300 transition-all">
                <IoSend className='text-2xl' />
            </button>
        </div>
    )
}

export default MessageBar