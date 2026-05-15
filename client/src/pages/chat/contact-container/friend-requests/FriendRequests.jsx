import { apiClient } from "@/lib/api.client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";
import {
    FRIEND_REQUEST_ITEM_ROUTE,
    FRIEND_REQUESTS_INCOMING_ROUTE,
    HOST
} from "@/utils/constant";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { HiOutlineUserGroup } from "react-icons/hi";

const displayName = (u) =>
    u?.firstName ? `${u.firstName}${u.lastName ? ` ${u.lastName}` : ""}`.trim() : u?.email || "User";

const FriendRequests = ({ onUpdated }) => {
    const [incoming, setIncoming] = useState([]);
    const [open, setOpen] = useState(false);
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
        load();
        const t = setInterval(load, 30000);
        return () => clearInterval(t);
    }, [load]);

    const respond = async (requestId, action) => {
        setLoading(true);
        try {
            await apiClient.patch(
                FRIEND_REQUEST_ITEM_ROUTE(requestId),
                { action },
                { withCredentials: true }
            );
            toast.success(action === "accept" ? "Friend added" : "Request declined");
            await load();
            onUpdated?.();
        } catch (e) {
            toast.error(e.response?.data?.message || "Action failed");
        } finally {
            setLoading(false);
        }
    };

    if (!incoming.length && !open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="mx-6 mb-2 text-xs text-muted-foreground hover:text-[#8417ff] flex items-center gap-1"
            >
                <HiOutlineUserGroup /> Friend requests
            </button>
        );
    }

    return (
        <div className="mx-4 mb-3 rounded-lg border border-[#8417ff]/30 bg-[#8417ff]/5 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-[#c4b5fd]"
            >
                <span className="flex items-center gap-2">
                    <HiOutlineUserGroup />
                    Friend requests
                    {incoming.length > 0 && (
                        <span className="bg-[#8417ff] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {incoming.length}
                        </span>
                    )}
                </span>
                <span className="text-xs opacity-70">{open ? "−" : "+"}</span>
            </button>
            {open && (
                <ul className="max-h-40 overflow-y-auto scrollbar-hidden px-2 pb-2 space-y-2">
                    {incoming.length === 0 ? (
                        <li className="text-xs text-muted-foreground px-2 py-1">No pending requests</li>
                    ) : (
                        incoming.map((req) => {
                            const from = req.from;
                            return (
                                <li key={req._id} className="flex items-center gap-2 p-2 rounded-md bg-black/10 dark:bg-white/5">
                                    <Avatar className="h-8 w-8 shrink-0">
                                        {from?.image ? (
                                            <AvatarImage src={`${HOST}/${from.image}`} alt="" />
                                        ) : (
                                            <AvatarFallback className={getColor(from?.color)}>
                                                {(from?.firstName || from?.email || "?").charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <span className="text-xs flex-1 truncate">{displayName(from)}</span>
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => respond(req._id, "accept")}
                                        className="text-[10px] px-2 py-1 rounded bg-[#8417ff] text-white"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => respond(req._id, "reject")}
                                        className="text-[10px] px-2 py-1 rounded border border-white/20"
                                    >
                                        Decline
                                    </button>
                                </li>
                            );
                        })
                    )}
                </ul>
            )}
        </div>
    );
};

export default FriendRequests;
