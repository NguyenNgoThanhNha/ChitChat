import { apiClient } from "@/lib/api.client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getColor, cn } from "@/lib/utils";
import { staggerStyle } from "@/components/layout/AnimatedPage";
import {
    BLOCKED_USERS_ROUTE,
    FRIEND_REQUEST_ITEM_ROUTE,
    FRIEND_REQUESTS_INCOMING_ROUTE,
    HOST,
    UNBLOCK_USER_ROUTE
} from "@/utils/constant";
import React, { useCallback, useEffect, useState } from "react";
import { HiOutlineUserGroup } from "react-icons/hi";
import { MdBlock } from "react-icons/md";
import { toast } from "sonner";

const displayName = (u) =>
    u?.firstName ? `${u.firstName}${u.lastName ? ` ${u.lastName}` : ""}`.trim() : u?.email || "User";

const iconBtnClass =
    "relative rounded-md p-2 text-muted-foreground hover:text-[#8417ff] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors";

const gridBtnClass =
    "page-stagger-item relative flex flex-col items-center justify-center gap-0.5 rounded-xl p-2 min-h-[52px] text-muted-foreground hover:text-[#8417ff] dark:hover:text-white hover:bg-[#8417ff]/10 border border-transparent hover:border-[#8417ff]/20 transition-all duration-300 active:scale-95";

const FriendRequestsDialog = ({ open, onOpenChange, onUpdated }) => {
    const [incoming, setIncoming] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await apiClient.get(FRIEND_REQUESTS_INCOMING_ROUTE, { withCredentials: true });
            setIncoming(res.data.requests || []);
        } catch {
            setIncoming([]);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        load();
    }, [open, load]);

    const respond = async (requestId, action) => {
        setLoading(true);
        try {
            await apiClient.patch(
                FRIEND_REQUEST_ITEM_ROUTE(requestId),
                { action },
                { withCredentials: true }
            );
            toast.success(action === "accept" ? "Đã chấp nhận" : "Đã từ chối");
            await load();
            onUpdated?.();
        } catch (e) {
            toast.error(e.response?.data?.message || "Thao tác thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="page-modal-in sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <HiOutlineUserGroup className="text-[#8417ff]" />
                        Lời mời kết bạn
                    </DialogTitle>
                </DialogHeader>
                <ul className="overflow-y-auto flex-1 space-y-2 pr-1 -mr-1">
                    {incoming.length === 0 ? (
                        <li className="text-sm text-muted-foreground py-6 text-center">Không có lời mời nào</li>
                    ) : (
                        incoming.map((req) => {
                            const from = req.from;
                            return (
                                <li
                                    key={req._id}
                                    className="page-stagger-item flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/50"
                                >
                                    <Avatar className="h-10 w-10 shrink-0">
                                        {from?.image ? (
                                            <AvatarImage src={`${HOST}/${from.image}`} alt="" />
                                        ) : (
                                            <AvatarFallback className={getColor(from?.color)}>
                                                {(from?.firstName || from?.email || "?").charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <span className="text-sm flex-1 truncate text-foreground font-medium">
                                        {displayName(from)}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => respond(req._id, "accept")}
                                        className="text-xs px-3 py-1.5 rounded-md bg-[#8417ff] hover:bg-[#741bda] text-white shrink-0"
                                    >
                                        Chấp nhận
                                    </button>
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => respond(req._id, "reject")}
                                        className="text-xs px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-accent shrink-0"
                                    >
                                        Từ chối
                                    </button>
                                </li>
                            );
                        })
                    )}
                </ul>
            </DialogContent>
        </Dialog>
    );
};

const BlockedUsersDialog = ({ open, onOpenChange, onUpdated }) => {
    const [blocked, setBlocked] = useState([]);
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        try {
            const res = await apiClient.get(BLOCKED_USERS_ROUTE, { withCredentials: true });
            setBlocked(res.data.blocked || []);
        } catch {
            setBlocked([]);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        load();
    }, [open, load]);

    const unblock = async (userId) => {
        setBusyId(userId);
        setLoading(true);
        try {
            const res = await apiClient.delete(UNBLOCK_USER_ROUTE(userId), { withCredentials: true });
            toast.success(
                res.data?.restoredFriendship
                    ? "Đã gỡ chặn — bạn bè hiện lại trong chat"
                    : "Đã gỡ chặn"
            );
            setBlocked((list) => list.filter((u) => String(u._id) !== String(userId)));
            onUpdated?.();
        } catch (e) {
            toast.error(e.response?.data?.message || "Không gỡ chặn được");
        } finally {
            setBusyId(null);
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="page-modal-in sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MdBlock className="text-red-500" />
                        Đã chặn
                    </DialogTitle>
                </DialogHeader>
                <ul className="overflow-y-auto flex-1 space-y-2 pr-1 -mr-1">
                    {blocked.length === 0 ? (
                        <li className="text-sm text-muted-foreground py-6 text-center">Chưa chặn ai</li>
                    ) : (
                        blocked.map((user) => (
                            <li
                                key={user._id}
                                className="page-stagger-item flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/50"
                            >
                                <Avatar className="h-10 w-10 shrink-0">
                                    {user?.image ? (
                                        <AvatarImage src={`${HOST}/${user.image}`} alt="" />
                                    ) : (
                                        <AvatarFallback className={getColor(user?.color)}>
                                            {(user?.firstName || user?.email || "?").charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <span className="text-sm flex-1 truncate text-foreground font-medium">
                                    {displayName(user)}
                                </span>
                                <button
                                    type="button"
                                    disabled={loading && busyId === user._id}
                                    onClick={() => unblock(user._id)}
                                    className="text-xs px-3 py-1.5 rounded-md border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                                >
                                    Gỡ chặn
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            </DialogContent>
        </Dialog>
    );
};

const SocialToolbar = ({ onContactsUpdated, variant = "inline" }) => {
    const [friendsOpen, setFriendsOpen] = useState(false);
    const [blockedOpen, setBlockedOpen] = useState(false);
    const [requestCount, setRequestCount] = useState(0);
    const [blockedCount, setBlockedCount] = useState(0);
    const isGrid = variant === "grid";
    const btnClass = isGrid ? gridBtnClass : iconBtnClass;

    const refreshCounts = useCallback(async () => {
        try {
            const [reqRes, blockRes] = await Promise.all([
                apiClient.get(FRIEND_REQUESTS_INCOMING_ROUTE, { withCredentials: true }),
                apiClient.get(BLOCKED_USERS_ROUTE, { withCredentials: true })
            ]);
            setRequestCount((reqRes.data.requests || []).length);
            setBlockedCount((blockRes.data.blocked || []).length);
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        refreshCounts();
        const t = setInterval(refreshCounts, 30000);
        return () => clearInterval(t);
    }, [refreshCounts]);

    const handleUpdated = () => {
        refreshCounts();
        onContactsUpdated?.();
    };

    const buttons = (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className={btnClass}
                        style={isGrid ? staggerStyle(0) : undefined}
                        onClick={() => setFriendsOpen(true)}
                        aria-label="Lời mời kết bạn"
                    >
                        <HiOutlineUserGroup className={cn(isGrid ? "text-xl" : "text-xl")} />
                        {isGrid && <span className="text-[9px] font-medium leading-none">Friends</span>}
                        {requestCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center rounded-full bg-[#8417ff] text-white text-[9px] font-medium">
                                {requestCount > 9 ? "9+" : requestCount}
                            </span>
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side={isGrid ? "right" : "top"}>Lời mời kết bạn</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className={btnClass}
                        style={isGrid ? staggerStyle(1) : undefined}
                        onClick={() => setBlockedOpen(true)}
                        aria-label="Danh sách chặn"
                    >
                        <MdBlock className="text-xl" />
                        {isGrid && <span className="text-[9px] font-medium leading-none">Blocked</span>}
                        {blockedCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-medium">
                                {blockedCount > 9 ? "9+" : blockedCount}
                            </span>
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side={isGrid ? "right" : "top"}>Đã chặn</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    return (
        <>
            {isGrid ? buttons : <div className="flex shrink-0 items-center gap-0.5">{buttons}</div>}
            <FriendRequestsDialog open={friendsOpen} onOpenChange={setFriendsOpen} onUpdated={handleUpdated} />
            <BlockedUsersDialog open={blockedOpen} onOpenChange={setBlockedOpen} onUpdated={handleUpdated} />
        </>
    );
};

export default SocialToolbar;
