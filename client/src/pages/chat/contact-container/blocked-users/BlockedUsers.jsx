import { apiClient } from "@/lib/api.client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";
import { BLOCKED_USERS_ROUTE, HOST, UNBLOCK_USER_ROUTE } from "@/utils/constant";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MdBlock } from "react-icons/md";

const displayName = (u) =>
    u?.firstName ? `${u.firstName}${u.lastName ? ` ${u.lastName}` : ""}`.trim() : u?.email || "User";

const BlockedUsers = ({ onUpdated }) => {
    const [blocked, setBlocked] = useState([]);
    const [open, setOpen] = useState(false);
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
        load();
    }, [load]);

    const unblock = async (userId) => {
        setBusyId(userId);
        setLoading(true);
        try {
            const res = await apiClient.delete(UNBLOCK_USER_ROUTE(userId), { withCredentials: true });
            toast.success(
                res.data?.restoredFriendship
                    ? "Đã gỡ chặn — bạn bè đã hiện lại trong danh sách chat"
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

    if (!blocked.length && !open) {
        return (
            <button
                type="button"
                onClick={() => {
                    setOpen(true);
                    load();
                }}
                className="mx-6 mb-2 text-xs text-muted-foreground hover:text-[#8417ff] flex items-center gap-1"
            >
                <MdBlock /> Danh sách chặn
            </button>
        );
    }

    return (
        <div className="mx-4 mb-3 rounded-lg border border-red-500/25 bg-red-500/5 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-red-400 dark:text-red-300"
            >
                <span className="flex items-center gap-2">
                    <MdBlock />
                    Đã chặn
                    {blocked.length > 0 && (
                        <span className="bg-red-500/80 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {blocked.length}
                        </span>
                    )}
                </span>
                <span className="text-xs opacity-70">{open ? "−" : "+"}</span>
            </button>
            {open && (
                <ul className="max-h-40 overflow-y-auto scrollbar-hidden px-2 pb-2 space-y-2">
                    {blocked.length === 0 ? (
                        <li className="text-xs text-muted-foreground px-2 py-1">Chưa chặn ai</li>
                    ) : (
                        blocked.map((user) => (
                            <li
                                key={user._id}
                                className="flex items-center gap-2 p-2 rounded-md bg-black/10 dark:bg-white/5"
                            >
                                <Avatar className="h-8 w-8 shrink-0">
                                    {user?.image ? (
                                        <AvatarImage src={`${HOST}/${user.image}`} alt="" />
                                    ) : (
                                        <AvatarFallback className={getColor(user?.color)}>
                                            {(user?.firstName || user?.email || "?").charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <span className="text-xs flex-1 truncate text-foreground">{displayName(user)}</span>
                                <button
                                    type="button"
                                    disabled={loading && busyId === user._id}
                                    onClick={() => unblock(user._id)}
                                    className="text-[10px] px-2 py-1 rounded border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                                >
                                    Gỡ chặn
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};

export default BlockedUsers;
