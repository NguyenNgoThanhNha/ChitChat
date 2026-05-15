import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiClient } from '@/lib/api.client';
import { getColor, cn } from '@/lib/utils';
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
import SocialToolbar from '../social-toolbar/SocialToolbar';

const iconBtn =
    "shrink-0 rounded-md p-1.5 sm:p-2 text-muted-foreground hover:text-[#8417ff] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors";

const ProfileInfo = ({ onContactsUpdated }) => {
    const { userInfo, setUserInfo } = useAppStore();
    const navigate = useNavigate();
    const { setTheme, resolvedTheme } = useTheme();
    const [soundOn, setSoundOn] = useState(() => isMessageSoundEnabled());

    const displayName =
        userInfo?.firstName && userInfo?.lastName
            ? `${userInfo.firstName} ${userInfo.lastName}`
            : (userInfo?.email || "");

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
        <TooltipProvider delayDuration={300}>
            <div className="absolute bottom-0 left-0 right-0 z-10 border-t-2 border-chat-border bg-chat-elevated pb-safe">
                <div className="flex items-stretch gap-1 px-2 py-2 sm:px-3 min-h-16">
                    {/* Avatar + name */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center gap-2 shrink-0 min-w-0 max-w-[38%] md:max-w-[42%] rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors p-0.5 -m-0.5"
                                onClick={() => navigate("/profile")}
                                aria-label="Profile"
                            >
                                <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0">
                                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden">
                                        {userInfo.image ? (
                                            <AvatarImage src={`${HOST}/${userInfo.image}`} alt="" className="object-cover w-full h-full" />
                                        ) : (
                                            <div className={cn(
                                                "uppercase h-9 w-9 sm:h-10 sm:w-10 text-sm border border-neutral-300 dark:border-white/10 flex items-center justify-center rounded-full",
                                                getColor(userInfo?.color)
                                            )}>
                                                {userInfo.firstName ? userInfo.firstName.split("").shift() : userInfo.email?.split("").shift()}
                                            </div>
                                        )}
                                    </Avatar>
                                </div>
                                <span className="truncate text-xs sm:text-sm text-foreground font-medium hidden min-[400px]:block">
                                    {displayName}
                                </span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">{displayName}</TooltipContent>
                    </Tooltip>

                    {/* Scrollable middle — social, shop, blog, sound, theme */}
                    <div className="toolbar-scroll flex flex-1 min-w-0 items-center gap-0.5 border-x border-chat-border/60 px-1 mx-0.5">
                        <SocialToolbar onContactsUpdated={onContactsUpdated} />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button type="button" className={iconBtn} onClick={() => navigate("/shop")} aria-label="Shop">
                                    <HiOutlineShoppingBag className="text-lg sm:text-xl" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Shop</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button type="button" className={iconBtn} onClick={() => navigate("/blog")} aria-label="Blog">
                                    <FiBookOpen className="text-lg sm:text-xl" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Blog</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button type="button" className={iconBtn} onClick={toggleMessageSound} aria-label="Message sound">
                                    {soundOn ? <HiOutlineSpeakerWave className="text-lg sm:text-xl" /> : <HiOutlineSpeakerXMark className="text-lg sm:text-xl" />}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">{soundOn ? "Mute message sound" : "Unmute message sound"}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button type="button" className={iconBtn} onClick={toggleTheme} aria-label="Toggle theme">
                                    {(resolvedTheme ?? "dark") === "dark" ? (
                                        <HiOutlineSun className="text-lg sm:text-xl" />
                                    ) : (
                                        <HiOutlineMoon className="text-lg sm:text-xl" />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Light / Dark</TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Pinned right — always visible */}
                    <div className="flex items-center gap-0.5 shrink-0 pl-0.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    className="shrink-0 rounded-md p-1.5 sm:p-2 text-purple-600 dark:text-purple-400 hover:text-purple-500 hover:bg-purple-500/10 transition-colors"
                                    onClick={() => navigate("/profile")}
                                    aria-label="Edit profile"
                                >
                                    <FiEdit2 className="text-lg sm:text-xl" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Edit Profile</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    className="shrink-0 rounded-md p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                    onClick={signOut}
                                    aria-label="Sign out"
                                >
                                    <IoPowerSharp className="text-lg sm:text-xl" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Sign Out</TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}

export default ProfileInfo
