import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiClient } from '@/lib/api.client';
import { getColor } from '@/lib/utils';
import { useAppStore } from '@/store/store'
import { HOST, SIGNOUT_ROUTE } from '@/utils/constant';
import { saveActiveChat } from '@/store/chatPersistence';
import React, { useEffect, useState } from 'react'
import { FiEdit2, FiBookOpen } from 'react-icons/fi';
import { HiOutlineShoppingBag } from 'react-icons/hi';
import { IoPowerSharp } from 'react-icons/io5';
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from 'react-icons/hi2';
import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { isMessageSoundEnabled, setMessageSoundEnabled } from '@/lib/messageSound';

const ProfileInfo = () => {
    const { userInfo, setUserInfo } = useAppStore();
    const navigate = useNavigate();
    const { setTheme, resolvedTheme } = useTheme();
    const [soundOn, setSoundOn] = useState(() => isMessageSoundEnabled());

    useEffect(() => {
        setSoundOn(isMessageSoundEnabled());
    }, []);

    const toggleMessageSound = () => {
        const next = !isMessageSoundEnabled();
        setMessageSoundEnabled(next);
        setSoundOn(next);
        toast.success(next ? "Message sound on" : "Message sound off");
    };

    const toggleTheme = () => {
        const next = (resolvedTheme ?? "dark") === "dark" ? "light" : "dark";
        setTheme(next);
    };

    const signOut = async () => {
        try {
            const response = await apiClient.post(SIGNOUT_ROUTE, {}, { withCredentials: true })
            if (response.status === 200) {
                toast.success(response.data.message)
                saveActiveChat(null, null);
                navigate("/auth")
                setUserInfo(null)
            }
        } catch (error) {
            console.log(error)
        }
    }
    return (
        <div className="absolute bottom-0 h-16 flex items-center justify-between px-4 sm:px-6 w-full border-t-2 border-chat-border bg-chat-elevated">
            <div className="flex gap-3 items-center justify-center min-w-0">
                <div className="w-12 h-12 relative shrink-0">
                    <Avatar className="h-12 w-12 rounded-full overflow-hidden">
                        {
                            userInfo.image ?
                                (<AvatarImage src={`${HOST}/${userInfo.image}`} alt="avatar" className="object-cover w-full h-full bg-black" />)
                                :
                                (
                                    <div className={`uppercase h-12 w-12 text-lg border border-neutral-300 dark:border-white/10 flex items-center justify-center rounded-full ${getColor(userInfo?.color)}`} >
                                        {userInfo.firstName ? userInfo.firstName.split("").shift() : userInfo.email?.split("").shift()}
                                    </div>
                                )
                        }
                    </Avatar>
                </div>
                <div className="truncate text-sm text-neutral-800 dark:text-white">
                    {
                        userInfo.firstName && userInfo.lastName ? `${userInfo.firstName} ${userInfo.lastName}` : (userInfo.email || "")
                    }
                </div>
            </div>
            <div className="flex gap-1 sm:gap-2 shrink-0 items-center">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className="rounded-md p-2 text-neutral-600 dark:text-neutral-400 hover:text-[#8417ff] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => navigate("/shop")}
                                aria-label="Shop"
                            >
                                <HiOutlineShoppingBag className="text-xl" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#1c1b1e] border border-[#2f303b] text-white">
                            Shop
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className="rounded-md p-2 text-neutral-600 dark:text-neutral-400 hover:text-[#8417ff] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => navigate("/blog")}
                                aria-label="Blog"
                            >
                                <FiBookOpen className="text-xl" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#1c1b1e] border border-[#2f303b] text-white">
                            Blog
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className="rounded-md p-2 text-neutral-600 dark:text-neutral-400 hover:text-[#8417ff] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={toggleMessageSound}
                                aria-label="Message sound"
                            >
                                {soundOn ? <HiOutlineSpeakerWave className="text-xl" /> : <HiOutlineSpeakerXMark className="text-xl" />}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#1c1b1e] border border-[#2f303b] text-white">
                            {soundOn ? "Mute new message sound" : "Unmute message sound"}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className="rounded-md p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                            >
                                {(resolvedTheme ?? "dark") === "dark" ? (
                                    <HiOutlineSun className="text-xl" />
                                ) : (
                                    <HiOutlineMoon className="text-xl" />
                                )}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#1c1b1e] border border-[#2f303b] text-white">
                            Light / Dark
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button type="button" className="rounded-md p-2 text-purple-600 dark:text-purple-500 hover:text-purple-500 dark:hover:text-purple-400 transition-colors" onClick={() => navigate("/profile")}>
                                <FiEdit2 className="text-xl" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#1c1b1e] border border-[#2f303b] text-white">
                            Edit Profile
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button type="button" className="rounded-md p-2 text-red-600 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400 transition-colors" onClick={signOut}>
                                <IoPowerSharp className="text-xl" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#1c1b1e] border border-[#2f303b] text-white">
                            Sign Out
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    )
}

export default ProfileInfo
