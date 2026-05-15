import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { cn, getColor } from "@/lib/utils";
import { apiClient } from "@/lib/api.client";
import { useAppStore } from "@/store/store";
import { HOST, SIGNOUT_ROUTE } from "@/utils/constant";
import { saveActiveChat } from "@/store/chatPersistence";
import { isMessageSoundEnabled, setMessageSoundEnabled } from "@/lib/messageSound";
import React, { useEffect, useRef, useState } from "react";
import { FiEdit2, FiChevronUp } from "react-icons/fi";
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark, HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import { IoPowerSharp } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTheme } from "next-themes";

const menuRow =
    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-[#8417ff]/10 transition-colors duration-200";

export function UserMenu() {
    const { userInfo, setUserInfo } = useAppStore();
    const navigate = useNavigate();
    const { setTheme, resolvedTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const [soundOn, setSoundOn] = useState(() => isMessageSoundEnabled());
    const rootRef = useRef(null);

    const displayName =
        userInfo?.firstName && userInfo?.lastName
            ? `${userInfo.firstName} ${userInfo.lastName}`
            : (userInfo?.email || "");

    useEffect(() => {
        setSoundOn(isMessageSoundEnabled());
    }, []);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, [open]);

    const toggleMessageSound = () => {
        const next = !isMessageSoundEnabled();
        setMessageSoundEnabled(next);
        setSoundOn(next);
        toast.success(next ? "Message sound on" : "Message sound off");
    };

    const toggleTheme = () => {
        setTheme((resolvedTheme ?? "dark") === "dark" ? "light" : "dark");
    };

    const signOut = async () => {
        try {
            const response = await apiClient.post(SIGNOUT_ROUTE, {}, { withCredentials: true });
            if (response.status === 200) {
                toast.success(response.data.message);
                saveActiveChat(null, null);
                navigate("/auth");
                setUserInfo(null);
            }
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div ref={rootRef} className="absolute bottom-0 left-0 right-0 z-10 pb-safe page-content-in">
            {open && (
                <div
                    className="absolute bottom-full left-2 right-2 mb-2 page-modal-in rounded-xl border border-border bg-popover/95 backdrop-blur-xl shadow-xl overflow-hidden"
                    role="menu"
                >
                    <div className="p-2 space-y-0.5">
                        <button type="button" className={menuRow} onClick={() => { navigate("/profile"); setOpen(false); }}>
                            <FiEdit2 className="text-lg text-[#8417ff]" />
                            Edit profile
                        </button>
                        <button type="button" className={menuRow} onClick={toggleMessageSound}>
                            {soundOn ? <HiOutlineSpeakerWave className="text-lg" /> : <HiOutlineSpeakerXMark className="text-lg" />}
                            {soundOn ? "Mute message sound" : "Unmute message sound"}
                        </button>
                        <button type="button" className={menuRow} onClick={toggleTheme}>
                            {(resolvedTheme ?? "dark") === "dark" ? (
                                <HiOutlineSun className="text-lg" />
                            ) : (
                                <HiOutlineMoon className="text-lg" />
                            )}
                            {(resolvedTheme ?? "dark") === "dark" ? "Light mode" : "Dark mode"}
                        </button>
                        <div className="my-1 h-px bg-border" />
                        <button
                            type="button"
                            className={cn(menuRow, "text-red-600 dark:text-red-400 hover:bg-red-500/10")}
                            onClick={signOut}
                        >
                            <IoPowerSharp className="text-lg" />
                            Sign out
                        </button>
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 border-t-2 border-chat-border bg-chat-elevated transition-all duration-300 hover:bg-[#8417ff]/5",
                    open && "bg-[#8417ff]/8"
                )}
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <div className="w-9 h-9 shrink-0">
                    <Avatar className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-[#8417ff]/30 transition-transform duration-300 hover:scale-105">
                        {userInfo?.image ? (
                            <AvatarImage src={`${HOST}/${userInfo.image}`} alt="" className="object-cover" />
                        ) : (
                            <div
                                className={cn(
                                    "uppercase h-9 w-9 text-sm flex items-center justify-center rounded-full border border-border",
                                    getColor(userInfo?.color)
                                )}
                            >
                                {userInfo?.firstName?.charAt(0) || userInfo?.email?.charAt(0) || "?"}
                            </div>
                        )}
                    </Avatar>
                </div>
                <span className="flex-1 min-w-0 text-left text-sm font-medium text-foreground truncate">
                    {displayName}
                </span>
                <FiChevronUp
                    className={cn(
                        "shrink-0 text-muted-foreground transition-transform duration-300",
                        open && "rotate-180"
                    )}
                />
            </button>
        </div>
    );
}
