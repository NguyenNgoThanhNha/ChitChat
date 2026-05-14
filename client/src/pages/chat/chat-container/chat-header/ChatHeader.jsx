import { getColor } from "@/lib/utils";
import { useAppStore } from "@/store/store"
import { HOST } from "@/utils/constant";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RiCloseFill } from "react-icons/ri"
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { useSocketContext } from "@/contexts/SocketContext";
import { useVoiceChannel } from "@/hooks/useVoiceChannel";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api.client";
import {
    CHANNEL_MEMBER_ROLE_ROUTE,
    CHANNEL_ADD_MEMBERS_ROUTE,
    CHANNEL_REMOVE_MEMBER_ROUTE,
    GET_ALL_CONTACT_ROUTE,
    SEARCH_MESSAGES_ROUTE,
    CHANNEL_LEAVE_ROUTE,
    CHANNEL_DELETE_ROUTE
} from "@/utils/constant";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import MultipleSelector from "@/components/multipleselect";
import { HiUsers } from "react-icons/hi";
import { FiSearch } from "react-icons/fi";
import { IoExitOutline, IoTrashOutline } from "react-icons/io5";
import moment from "moment";
import { searchMessagesInList } from "@/lib/foldSearch";
import { useConfirmUi } from "@/store/confirm-ui";

const ChatHeader = () => {
    const {
        closeChat,
        selectedChatData,
        selectedChatType,
        userInfo,
        onlineUserIds,
        updateChannelMemberRole,
        syncChannelFromServer,
        selectedChatMessages,
        removeChannelFromList,
        setHighlightMessageId
    } = useAppStore();
    const socket = useSocketContext();
    const channelId = selectedChatType === "channel" ? selectedChatData?._id : null;
    const { joined, error, joinVoice, leaveVoice, remoteAudioContainerRef } = useVoiceChannel(socket, channelId, userInfo?.id);
    const [manageOpen, setManageOpen] = useState(false);
    const [allContacts, setAllContacts] = useState([]);
    const [selectedToAdd, setSelectedToAdd] = useState([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQ, setSearchQ] = useState("");
    const [searchHits, setSearchHits] = useState([]);

    useEffect(() => {
        return () => {
            leaveVoice();
        };
    }, [selectedChatData?._id, selectedChatType, leaveVoice]);

    useEffect(() => {
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
            Notification.requestPermission().catch(() => { });
        }
    }, []);

    useEffect(() => {
        if (!manageOpen || selectedChatType !== "channel") return;
        (async () => {
            try {
                const res = await apiClient.get(GET_ALL_CONTACT_ROUTE, { withCredentials: true });
                setAllContacts(res.data.contacts || []);
            } catch {
                setAllContacts([]);
            }
        })();
    }, [manageOpen, selectedChatType]);

    const isChannelAdmin = selectedChatType === "channel" && selectedChatData &&
        String(selectedChatData.admin?._id ?? selectedChatData.admin) === String(userInfo?.id);

    const peerOnline = selectedChatType === "contact" && selectedChatData &&
        onlineUserIds?.[selectedChatData._id];

    const memberIdSet = new Set(
        (selectedChatData?.members || []).map((m) => String(m._id ?? m))
    );
    memberIdSet.add(String(selectedChatData?.admin?._id ?? selectedChatData?.admin));

    const addOptions = allContacts.filter((c) => !memberIdSet.has(String(c.value)));

    const saveRole = async (targetUserId, role) => {
        try {
            const res = await apiClient.patch(CHANNEL_MEMBER_ROLE_ROUTE(selectedChatData._id), { targetUserId, role }, { withCredentials: true });
            if (res.data?.channel) syncChannelFromServer(res.data.channel);
            else updateChannelMemberRole(selectedChatData._id, targetUserId, role);
            toast.success("Role updated");
        } catch {
            toast.error("Could not update role");
        }
    };

    const addMembers = async () => {
        if (!selectedToAdd.length) {
            toast.message("Select at least one contact");
            return;
        }
        try {
            const userIds = selectedToAdd.map((c) => c.value);
            const res = await apiClient.post(
                CHANNEL_ADD_MEMBERS_ROUTE(selectedChatData._id),
                { userIds },
                { withCredentials: true }
            );
            if (res.data?.channel) syncChannelFromServer(res.data.channel);
            setSelectedToAdd([]);
            toast.success("Members added");
        } catch (e) {
            toast.error(e.response?.data?.message || "Could not add members");
        }
    };

    const removeMember = async (memberUserId) => {
        const ok = await useConfirmUi.getState().show({
            title: "Gỡ thành viên?",
            description: "Người này sẽ bị xóa khỏi channel.",
            destructive: true
        });
        if (!ok) return;
        try {
            const res = await apiClient.delete(
                CHANNEL_REMOVE_MEMBER_ROUTE(selectedChatData._id, memberUserId),
                { withCredentials: true }
            );
            if (res.data?.channel) syncChannelFromServer(res.data.channel);
            toast.success("Member removed");
        } catch (e) {
            toast.error(e.response?.data?.message || "Could not remove");
        }
    };

    const runSearch = async () => {
        const q = searchQ.trim();
        if (!q) {
            toast.message("Nhập từ khóa");
            return;
        }
        const localHits = searchMessagesInList(selectedChatMessages, q);
        try {
            const params = { q };
            if (selectedChatType === "channel") {
                params.channelId = String(selectedChatData._id);
            } else {
                params.dmPeerId = String(selectedChatData._id);
            }
            const res = await apiClient.get(SEARCH_MESSAGES_ROUTE, { params, withCredentials: true });
            const apiHits = res.data.messages || [];
            const merged = new Map();
            for (const m of [...apiHits, ...localHits]) {
                if (m?._id) merged.set(String(m._id), m);
            }
            const list = [...merged.values()].sort(
                (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
            );
            setSearchHits(list);
            setSearchOpen(true);
            if (!list.length) toast.message("Không thấy tin nhắn");
        } catch (e) {
            if (localHits.length) {
                setSearchHits(localHits);
                setSearchOpen(true);
                toast.message("Chỉ hiện kết quả trong tin đang tải");
            } else {
                toast.error(e.response?.data?.message || "Search failed");
            }
        }
    };

    const leaveChannel = async () => {
        const ok = await useConfirmUi.getState().show({
            title: "Rời channel?",
            description: "Bạn sẽ không còn thấy channel trong danh sách.",
            destructive: false,
            confirmLabel: "Rời channel"
        });
        if (!ok) return;
        try {
            await apiClient.post(CHANNEL_LEAVE_ROUTE(selectedChatData._id), {}, { withCredentials: true });
            removeChannelFromList(selectedChatData._id);
            toast.success("Đã rời channel");
        } catch (e) {
            toast.error(e.response?.data?.message || "Không rời được");
        }
    };

    const deleteChannel = async () => {
        const ok = await useConfirmUi.getState().show({
            title: "Xóa channel?",
            description: "Toàn bộ tin nhắn sẽ bị xóa vĩnh viễn. Không hoàn tác.",
            destructive: true,
            confirmLabel: "Xóa hẳn"
        });
        if (!ok) return;
        try {
            await apiClient.delete(CHANNEL_DELETE_ROUTE(selectedChatData._id), { withCredentials: true });
            removeChannelFromList(selectedChatData._id);
            toast.success("Đã xóa channel");
        } catch (e) {
            toast.error(e.response?.data?.message || "Không xóa được");
        }
    };

    const canSearch = selectedChatType === "channel" || selectedChatType === "contact";

    return (
        <div className="h-[10vh] min-h-[64px] border-b-2 border-chat-border bg-chat-surface flex items-center justify-between px-6 md:px-20 transition-colors duration-300">
            <div ref={remoteAudioContainerRef} className="hidden" aria-hidden />
            <div className="flex gap-4 items-center w-full justify-between min-w-0">
                <div className="flex gap-3 items-center justify-center min-w-0">
                    <div className='w-11 h-11 relative shrink-0 transition-transform duration-200 hover:scale-105'>
                        {selectedChatType === "contact" ?
                            <Avatar className='h-11 w-11 rounded-full overflow-hidden'>
                                {
                                    selectedChatData.image ?
                                        (<AvatarImage src={`${HOST}/${selectedChatData.image}`} alt="avatar" className="object-cover w-full h-full bg-black rounded-full" />)
                                        :
                                        (
                                            <AvatarFallback className={`uppercase h-11 w-11 text-base border border-black/10 dark:border-white/10 flex items-center justify-center rounded-full ${getColor(selectedChatData.color)}`} >
                                                {selectedChatData.firstName ? selectedChatData.firstName.split("").shift() : selectedChatData.email?.split("").shift()}
                                            </AvatarFallback>
                                        )
                                }
                            </Avatar>
                            :
                            <div className='bg-black/10 dark:bg-[#ffffff22] h-10 w-10 flex items-center justify-center rounded-full text-foreground dark:text-white'>#</div>
                        }
                        {selectedChatType === "contact" && (
                            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-chat-surface ${peerOnline ? "bg-emerald-500" : "bg-neutral-500"}`} title={peerOnline ? "Online" : "Offline"} />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">
                            {selectedChatType === "channel" && selectedChatData.name}
                            {selectedChatType === "contact" && (selectedChatData.firstName ? `${selectedChatData.firstName} ${selectedChatData.lastName}` : selectedChatData.email)}
                        </div>
                        {selectedChatType === "channel" && (
                            <div className="text-xs text-muted-foreground truncate">
                                {(selectedChatData.members?.length || 0) + 1} members · Channel
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-1 sm:gap-2 items-center justify-center shrink-0">
                    {selectedChatType === "channel" && (
                        <>
                            {joined ? (
                                <button type="button" title="Leave voice" className="rounded-lg p-2 text-red-600 dark:text-red-500 hover:bg-red-500/10 transition-colors duration-200" onClick={leaveVoice}>
                                    <FaMicrophoneSlash className="text-xl" />
                                </button>
                            ) : (
                                <button type="button" title="Join voice" className="rounded-lg p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors duration-200" onClick={joinVoice}>
                                    <FaMicrophone className="text-xl" />
                                </button>
                            )}
                            {isChannelAdmin && (
                                <button
                                    type="button"
                                    className="sm:hidden rounded-lg p-2 text-muted-foreground border border-border hover:bg-muted"
                                    title="Manage channel"
                                    onClick={() => setManageOpen(true)}
                                >
                                    <HiUsers className="text-xl" />
                                </button>
                            )}
                            {isChannelAdmin && (
                                <button
                                    type="button"
                                    className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-md px-3 py-2 hover:bg-muted hover:text-foreground transition-all duration-200"
                                    onClick={() => setManageOpen(true)}
                                >
                                    <HiUsers className="text-base" />
                                    Manage
                                </button>
                            )}
                            {!isChannelAdmin && (
                                <button
                                    type="button"
                                    title="Rời channel"
                                    className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                    onClick={leaveChannel}
                                >
                                    <IoExitOutline className="text-xl" />
                                </button>
                            )}
                            {isChannelAdmin && (
                                <button
                                    type="button"
                                    title="Xóa channel"
                                    className="rounded-lg p-2 text-red-600 dark:text-red-500 hover:bg-red-500/10 transition-colors"
                                    onClick={deleteChannel}
                                >
                                    <IoTrashOutline className="text-xl" />
                                </button>
                            )}
                        </>
                    )}
                    {canSearch && (
                        <button
                            type="button"
                            title="Tìm trong chat"
                            className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            onClick={() => { setSearchOpen(true); setSearchHits([]); }}
                        >
                            <FiSearch className="text-xl" />
                        </button>
                    )}
                    {error && <span className="text-xs text-red-500 max-w-[100px] hidden sm:inline">{error}</span>}
                    <button
                        type="button"
                        className="rounded-lg p-2 text-muted-foreground hover:text-foreground transition-all duration-200"
                        onClick={closeChat}
                    >
                        <RiCloseFill className="text-2xl" />
                    </button>
                </div>
            </div>

            <Dialog open={manageOpen} onOpenChange={setManageOpen}>
                <DialogContent className="bg-popover border border-border text-popover-foreground max-h-[85vh] overflow-y-auto sm:max-w-lg animate-in zoom-in-95 duration-200">
                    <DialogHeader>
                        <DialogTitle>Channel: {selectedChatData?.name}</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="members" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-muted border border-border">
                            <TabsTrigger value="members" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground">Members</TabsTrigger>
                            <TabsTrigger value="roles" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground">Roles</TabsTrigger>
                        </TabsList>
                        <TabsContent value="members" className="space-y-4 mt-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Add people from your contacts</p>
                                <MultipleSelector
                                    className="rounded-lg bg-muted border border-border py-2"
                                    defaultOptions={addOptions}
                                    placeholder="Search contacts to add"
                                    value={selectedToAdd}
                                    onChange={setSelectedToAdd}
                                    emptyIndicator={<p className="text-center text-sm text-muted-foreground py-4">No contacts left to add</p>}
                                />
                                <button
                                    type="button"
                                    className="mt-3 w-full rounded-md bg-[#8417ff] hover:bg-[#741bda] text-white py-2 text-sm font-medium transition-colors duration-200"
                                    onClick={addMembers}
                                >
                                    Add selected
                                </button>
                            </div>
                            <div className="border-t border-border pt-3">
                                <p className="text-sm font-medium mb-2">Current members</p>
                                <ul className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                                    {(selectedChatData?.members || []).map((m) => {
                                        const id = m._id ?? m;
                                        const isOwner = String(selectedChatData.admin?._id ?? selectedChatData.admin) === String(id);
                                        return (
                                            <li key={id} className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-sm border border-border/50">
                                                <span className="truncate">{m.firstName || m.email || id}{isOwner ? " · owner" : ""}</span>
                                                {isChannelAdmin && !isOwner && (
                                                    <button
                                                        type="button"
                                                        className="shrink-0 text-xs text-red-600 hover:underline"
                                                        onClick={() => removeMember(String(id))}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </TabsContent>
                        <TabsContent value="roles" className="space-y-3 text-sm mt-4">
                            <p className="text-muted-foreground text-xs">Moderators can delete anyone&apos;s messages. Members can only delete their own.</p>
                            {(selectedChatData?.members || []).map((m) => {
                                const id = m._id ?? m;
                                const isOwner = String(selectedChatData.admin?._id ?? selectedChatData.admin) === String(id);
                                const row = selectedChatData.memberRoles?.find((r) => String(r.user?._id ?? r.user) === String(id));
                                const role = isOwner ? "admin" : (row?.role || "member");
                                return (
                                    <div key={id} className="flex justify-between items-center gap-2 bg-muted rounded-md p-3 border border-border/50">
                                        <span className="truncate">{m.firstName || m.email || id}</span>
                                        {isOwner ? <span className="text-muted-foreground text-xs">Owner</span> : (
                                            <select
                                                className="bg-background rounded-md border border-border px-2 py-1 text-xs"
                                                value={role}
                                                onChange={(e) => saveRole(id, e.target.value)}
                                            >
                                                <option value="member">member</option>
                                                <option value="moderator">moderator</option>
                                            </select>
                                        )}
                                    </div>
                                );
                            })}
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                <DialogContent className="bg-popover border border-border text-popover-foreground max-h-[80vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tìm trong cuộc trò chuyện</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-2">
                        <Input
                            className="bg-muted border-border flex-1"
                            value={searchQ}
                            onChange={(e) => setSearchQ(e.target.value)}
                            placeholder="Không dấu, tên file…"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    runSearch();
                                }
                            }}
                        />
                        <button type="button" className="bg-[#8417ff] hover:bg-[#741bda] text-white px-4 rounded-lg shrink-0 h-10" onClick={() => runSearch()}>Tìm</button>
                    </div>
                    <div className="mt-3 space-y-2 max-h-[50vh] overflow-y-auto">
                        {searchHits.map((m) => (
                            <button
                                type="button"
                                key={m._id}
                                className="block w-full text-left text-sm p-3 rounded-lg bg-muted hover:bg-accent border border-transparent transition-all"
                                onClick={() => {
                                    setHighlightMessageId(m._id);
                                    setSearchOpen(false);
                                }}
                            >
                                <span className="text-xs text-muted-foreground">{moment(m.timestamp).format("LLL")}</span>
                                <div className="truncate">
                                    {m.isDeleted
                                        ? "(deleted)"
                                        : m.messageType === "file"
                                            ? (m.fileUrl ? m.fileUrl.split("/").pop() : "File")
                                            : (m.content || "")}
                                </div>
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ChatHeader
