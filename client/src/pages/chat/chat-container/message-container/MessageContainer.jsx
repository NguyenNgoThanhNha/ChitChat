import { getColor } from '@/lib/utils';
import { apiClient } from '@/lib/api.client';
import { useAppStore } from '@/store/store';
import {
    DELETE_MESSAGE_ROUTE,
    EDIT_MESSAGE_ROUTE,
    GET_CHANNELS_MESSAGES_ROUTE,
    GET_MESSAGE_ROUTE,
    HOST,
    MARK_READ_ROUTE,
    READ_STATE_ROUTE,
    REACT_MESSAGE_ROUTE,
    DEFAULT_MESSAGE_PAGE_SIZE
} from '@/utils/constant';
import { MdFolderZip } from "react-icons/md"
import { IoMdArrowRoundDown } from "react-icons/io"
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react'
import { IoCloseSharp } from 'react-icons/io5';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useConfirmUi } from "@/store/confirm-ui";

const sid = (a, b) => String(a ?? "") === String(b ?? "");

const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const MessageContainer = () => {
    const scrollRef = useRef();
    const listRef = useRef();
    const shouldScrollToBottom = useRef(true);
    const prevScrollHeight = useRef(0);
    const {
        selectedChatData,
        selectedChatType,
        selectedChatMessages,
        setselectedChatMessages,
        setDownLoading,
        setFileDownloadProgress,
        userInfo,
        setReplyToMessage,
        dmReadState,
        setDmReadState,
        channelReadReceipts,
        setChannelReadReceipts,
        hasMoreMessages,
        setHasMoreMessages,
        loadingOlderMessages,
        setLoadingOlderMessages,
        prependMessages,
        highlightMessageId,
        setHighlightMessageId,
        typingPeers,
        directMessagesContacts
    } = useAppStore();
    const myUserId = userInfo?.id ?? userInfo?._id;
    const [showImage, setShowImage] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [editId, setEditId] = useState(null);

    const loadInitialMessages = async () => {
        if (!selectedChatData?._id) return;
        const params = { limit: DEFAULT_MESSAGE_PAGE_SIZE };
        try {
            if (selectedChatType === "contact") {
                const response = await apiClient.post(
                    GET_MESSAGE_ROUTE,
                    { id: selectedChatData._id },
                    { params, withCredentials: true }
                );
                if (response.status === 200) {
                    setselectedChatMessages(response.data.messages || []);
                    setHasMoreMessages(!!response.data.hasMore);
                }
            } else if (selectedChatType === "channel") {
                const response = await apiClient.get(
                    `${GET_CHANNELS_MESSAGES_ROUTE}/${selectedChatData._id}`,
                    { params, withCredentials: true }
                );
                if (response.status === 200) {
                    setselectedChatMessages(response.data.messages || []);
                    setHasMoreMessages(!!response.data.hasMore);
                }
            }
            shouldScrollToBottom.current = true;
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (!selectedChatData?._id) return;
        setHasMoreMessages(false);
        setselectedChatMessages([]);
        loadInitialMessages();
    }, [selectedChatData?._id, selectedChatType]);

    const loadOlderMessages = async () => {
        if (!hasMoreMessages || loadingOlderMessages || !selectedChatMessages.length) return;
        const before = selectedChatMessages[0]._id;
        const params = { limit: DEFAULT_MESSAGE_PAGE_SIZE, before };
        setLoadingOlderMessages(true);
        prevScrollHeight.current = listRef.current?.scrollHeight || 0;

        try {
            if (selectedChatType === "contact") {
                const response = await apiClient.post(
                    GET_MESSAGE_ROUTE,
                    { id: selectedChatData._id },
                    { params, withCredentials: true }
                );
                if (response.status === 200 && response.data.messages?.length) {
                    prependMessages(response.data.messages);
                    setHasMoreMessages(!!response.data.hasMore);
                    shouldScrollToBottom.current = false;
                } else {
                    setHasMoreMessages(false);
                }
            } else if (selectedChatType === "channel") {
                const response = await apiClient.get(
                    `${GET_CHANNELS_MESSAGES_ROUTE}/${selectedChatData._id}`,
                    { params, withCredentials: true }
                );
                if (response.status === 200 && response.data.messages?.length) {
                    prependMessages(response.data.messages);
                    setHasMoreMessages(!!response.data.hasMore);
                    shouldScrollToBottom.current = false;
                } else {
                    setHasMoreMessages(false);
                }
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoadingOlderMessages(false);
            requestAnimationFrame(() => {
                const el = listRef.current;
                if (el) {
                    el.scrollTop = el.scrollHeight - prevScrollHeight.current;
                }
            });
        }
    };

    const handleListScroll = (e) => {
        if (e.target.scrollTop < 80) loadOlderMessages();
    };

    useEffect(() => {
        const loadRead = async () => {
            if (!selectedChatData?._id) return;
            try {
                if (selectedChatType === "contact") {
                    const res = await apiClient.get(READ_STATE_ROUTE, {
                        params: { kind: "dm", contextId: selectedChatData._id },
                        withCredentials: true
                    });
                    if (res.data) setDmReadState({ myLastRead: res.data.myLastRead, theirLastRead: res.data.theirLastRead });
                } else if (selectedChatType === "channel") {
                    const res = await apiClient.get(READ_STATE_ROUTE, {
                        params: { kind: "channel", contextId: selectedChatData._id },
                        withCredentials: true
                    });
                    const receipts = (res.data?.receipts || []).map((r) => ({
                        user: String(r.user),
                        lastReadMessage: r.lastReadMessage ? String(r.lastReadMessage) : null
                    }));
                    setChannelReadReceipts(receipts);
                }
            } catch (e) {
                console.log(e);
            }
        };
        loadRead();
    }, [selectedChatData?._id, selectedChatType, setDmReadState, setChannelReadReceipts]);

    useEffect(() => {
        const last = selectedChatMessages[selectedChatMessages.length - 1];
        if (!last?._id || !selectedChatData?._id) return;
        const t = setTimeout(async () => {
            try {
                await apiClient.post(MARK_READ_ROUTE, {
                    kind: selectedChatType === "channel" ? "channel" : "dm",
                    contextId: selectedChatData._id,
                    lastReadMessageId: last._id
                }, { withCredentials: true });
                if (selectedChatType === "contact") {
                    setDmReadState((prev) => ({ ...prev, myLastRead: last._id }));
                } else if (selectedChatType === "channel") {
                    const uid = String(myUserId);
                    setChannelReadReceipts((prev) => {
                        const next = [...prev];
                        const idx = next.findIndex((r) => String(r.user) === uid);
                        const row = { user: uid, lastReadMessage: String(last._id) };
                        if (idx >= 0) next[idx] = row;
                        else next.push(row);
                        return next;
                    });
                }
            } catch (e) {
                /* ignore */
            }
        }, 600);
        return () => clearTimeout(t);
    }, [selectedChatMessages, selectedChatData?._id, selectedChatType, setDmReadState]);

    useEffect(() => {
        if (!highlightMessageId) return;
        const el = document.querySelector(`[data-msg-id="${highlightMessageId}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightMessageId(null);
    }, [highlightMessageId, selectedChatMessages, setHighlightMessageId]);

    const prevMessageCount = useRef(0);

    useEffect(() => {
        if (loadingOlderMessages) {
            prevMessageCount.current = selectedChatMessages.length;
            return;
        }
        if (selectedChatMessages.length > prevMessageCount.current) {
            shouldScrollToBottom.current = true;
        }
        prevMessageCount.current = selectedChatMessages.length;

        if (!shouldScrollToBottom.current) return;
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [selectedChatMessages, loadingOlderMessages]);

    const downloadFile = async (url) => {
        try {
            setDownLoading(true);
            setFileDownloadProgress(0);
            const response = await apiClient.get(`${HOST}/${url}`, {
                responseType: "blob",
                withCredentials: true,
                onDownloadProgress: (progressEvent) => {
                    const { loaded, total } = progressEvent;
                    const percentCompleted = Math.round((loaded * 100) / total);
                    setFileDownloadProgress(percentCompleted)
                }
            });

            const urlBlob = window.URL.createObjectURL(response.data);
            const link = document.createElement("a");
            link.href = urlBlob;
            link.setAttribute("download", url.split("/").pop());
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(urlBlob);
            setDownLoading(false);
        } catch (error) {
            console.error("Error downloading the file:", error);
        }
    };

    const checkIfImage = (filePath) => {
        const imageRegex = /\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|heic|heif)$/i;
        return imageRegex.test(filePath);
    };

    const isPeerRead = (message) => {
        if (selectedChatType !== "contact" || !dmReadState?.theirLastRead || !message?._id) return false;
        const mine = sid(message.sender, myUserId) || sid(message.sender?._id, myUserId);
        if (!mine) return false;
        const ids = selectedChatMessages.map((m) => m._id.toString());
        const readIdx = ids.indexOf(String(dmReadState.theirLastRead));
        const msgIdx = ids.indexOf(message._id.toString());
        if (readIdx < 0 || msgIdx < 0) return false;
        return msgIdx <= readIdx;
    };

    const getChannelReaderNames = (message) => {
        if (selectedChatType !== "channel" || !message?._id) return [];
        const mine = sid(message.sender?._id, myUserId) || sid(message.sender, myUserId);
        if (!mine) return [];
        const ids = selectedChatMessages.map((m) => String(m._id));
        const msgIdx = ids.indexOf(String(message._id));
        if (msgIdx < 0) return [];

        const receipts = Array.isArray(channelReadReceipts) ? channelReadReceipts : [];

        const members = [
            ...(selectedChatData?.members || []),
            selectedChatData?.admin
        ].filter(Boolean);

        return receipts
            .filter((r) => {
                if (String(r.user) === String(myUserId) || !r.lastReadMessage) return false;
                const readIdx = ids.indexOf(String(r.lastReadMessage));
                return readIdx >= 0 && msgIdx <= readIdx;
            })
            .map((r) => {
                const m = members.find((x) => sid(x?._id ?? x, r.user));
                if (m?.firstName) return `${m.firstName}${m.lastName ? ` ${m.lastName}` : ""}`.trim();
                return m?.email || "Member";
            });
    };

    const canModerateChannel = () => {
        if (selectedChatType !== "channel" || !selectedChatData) return false;
        if (sid(selectedChatData.admin?._id ?? selectedChatData.admin, myUserId)) return true;
        return selectedChatData.memberRoles?.some(
            (r) => sid(r.user?._id ?? r.user, myUserId) && r.role === "moderator"
        );
    };

    const openEdit = (m) => {
        if (m.messageType !== "text" || m.isDeleted) return;
        setEditId(m._id);
        setEditContent(m.content || "");
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!editId) return;
        try {
            const res = await apiClient.patch(EDIT_MESSAGE_ROUTE, { messageId: editId, content: editContent }, { withCredentials: true });
            if (res.data?.message) {
                useAppStore.getState().updateMessageInList(res.data.message);
            }
            setEditOpen(false);
        } catch {
            toast.error("Could not edit message");
        }
    };

    const deleteMsg = async (id) => {
        const ok = await useConfirmUi.getState().show({
            title: "Xóa tin nhắn?",
            description: "Tin sẽ bị gỡ khỏi cuộc trò chuyện.",
            destructive: true
        });
        if (!ok) return;
        try {
            await apiClient.delete(DELETE_MESSAGE_ROUTE, { data: { messageId: id }, withCredentials: true });
            useAppStore.getState().markMessageDeleted(id);
        } catch {
            toast.error("Could not delete");
        }
    };

    const toggleReaction = async (messageId, emoji) => {
        try {
            const res = await apiClient.post(REACT_MESSAGE_ROUTE, { messageId, emoji }, { withCredentials: true });
            if (res.data?.message) {
                useAppStore.getState().updateMessageInList(res.data.message);
            }
        } catch {
            toast.error("Reaction failed");
        }
    };

    const typingLabel = () => {
        if (!typingPeers?.length) return null;
        if (selectedChatType === "contact") {
            const names = typingPeers.map((id) => {
                const c = directMessagesContacts?.find((x) => sid(x._id, id));
                return c?.firstName || c?.name || c?.email || "Someone";
            });
            return `${names.join(", ")} typing…`;
        }
        const names = typingPeers.map((id) => {
            const m = selectedChatData?.members?.find((x) => sid(x._id, id));
            return m?.firstName || m?.email || "Someone";
        });
        return `${names.join(", ")} typing…`;
    };

    const renderReplySnippet = (replyTo) => {
        if (!replyTo) return null;
        const sn = replyTo.isDeleted ? "(deleted)" : (replyTo.content || replyTo.fileUrl || "");
        return (
            <div className="text-xs opacity-70 border-l-2 border-[#8417ff]/40 pl-2 mb-1 max-w-full truncate text-muted-foreground dark:text-white/70">
                {replyTo.sender?.firstName || replyTo.sender?.email || "User"}: {sn}
            </div>
        );
    };

    const renderReactions = (message, isMine) => {
        const groups = {};
        (message.reactions || []).forEach((r) => {
            const k = r.emoji;
            if (!groups[k]) groups[k] = { count: 0, mine: false };
            groups[k].count += 1;
            if (sid(r.user?._id ?? r.user, myUserId)) groups[k].mine = true;
        });
        return (
            <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                {Object.entries(groups).map(([emoji, g]) => (
                    <button
                        type="button"
                        key={emoji}
                        className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${g.mine ? "border-[#8417ff]/50 bg-[#8417ff]/15" : "border-border dark:border-white/10 bg-muted/80 dark:bg-black/20"}`}
                        onClick={() => toggleReaction(message._id, emoji)}
                    >
                        {emoji} {g.count}
                    </button>
                ))}
                {quickReactions.map((e) => (
                    <button type="button" key={`add-${e}`} className="text-xs px-1 opacity-60 hover:opacity-100" onClick={() => toggleReaction(message._id, e)}>{e}</button>
                ))}
            </div>
        );
    };

    const renderActions = (message, isMine) => {
        if (message.isDeleted) return null;
        return (
            <div className={`flex gap-2 text-[11px] text-muted-foreground dark:text-white/50 mt-1 flex-wrap ${isMine ? "justify-end" : "justify-start"}`}>
                <button type="button" className="hover:text-foreground dark:hover:text-white" onClick={() => setReplyToMessage(message)}>Reply</button>
                {isMine && message.messageType === "text" && (
                    <button type="button" className="hover:text-foreground dark:hover:text-white" onClick={() => openEdit(message)}>Edit</button>
                )}
                {(isMine || (selectedChatType === "channel" && canModerateChannel())) && (
                    <button type="button" className="hover:text-red-600 dark:hover:text-red-400" onClick={() => deleteMsg(message._id)}>Delete</button>
                )}
            </div>
        );
    };

    const renderDMMessages = (message) => {
        const fromPeer = sid(message.sender, selectedChatData._id) || sid(message.sender?._id, selectedChatData._id);
        const isMine = !fromPeer;
        return (
            <div data-msg-id={message._id} className={`${isMine ? "text-right" : "text-left"}`}>
                {renderReplySnippet(message.replyTo)}
                {
                    message.messageType === "text" && (
                        <div className={`${isMine ?
                            "bg-violet-50 border-violet-300 text-violet-950 dark:bg-[#8417ff]/5 dark:text-[#8417ff]/90 dark:border-[#8417ff]/50" :
                            "bg-neutral-100 border-neutral-200 text-neutral-900 dark:bg-[#2a2b33]/5 dark:text-white/80 dark:border-white/20"} border inline-block p-4 rounded-lg my-1 max-w-[50%] break-words shadow-sm chat-message-enter`}>
                            {message.isDeleted ? <span className="italic opacity-60">Message deleted</span> : message.content}
                            {message.editedAt && !message.isDeleted && <span className="text-[10px] opacity-50"> (edited)</span>}
                        </div>
                    )
                }
                {
                    message.messageType === "file" && !message.isDeleted && (
                        <div className={`${isMine ?
                            "bg-violet-50 border-violet-300 text-violet-950 dark:bg-[#8417ff]/5 dark:text-[#8417ff]/90 dark:border-[#8417ff]/50" :
                            "bg-neutral-100 border-neutral-200 text-neutral-900 dark:bg-[#2a2b33]/5 dark:text-white/80 dark:border-white/20"} border inline-block p-4 rounded-lg my-1 max-w-[50%] break-words shadow-sm chat-message-enter`}>
                            {checkIfImage(message.fileUrl) ?
                                <div className='cursor-pointer'
                                    onClick={() => {
                                        setShowImage(true);
                                        setImageUrl(message.fileUrl)
                                    }}
                                >
                                    <img src={`${HOST}/${message.fileUrl}`} alt="" height={300} width={300}></img>
                                </div> :
                                <div className='flex items-center justify-center gap-4'>
                                    <span className='text-foreground/40 dark:text-white/8- text-3xl bg-black/10 dark:bg-black/20 rounded-full p-3'>
                                        <MdFolderZip />
                                    </span>
                                    <span>
                                        {message.fileUrl.split('/').pop()}
                                    </span>
                                    <span className='bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300'
                                        onClick={() => downloadFile(message.fileUrl)}>
                                        <IoMdArrowRoundDown />
                                    </span>
                                </div>}
                        </div>
                    )
                }
                {renderReactions(message, isMine)}
                {renderActions(message, isMine)}
                <div className="text-xs text-muted-foreground flex flex-col gap-0.5 items-end">
                    <span>{moment(message.timestamp).format("LT")}</span>
                    {isMine && isPeerRead(message) && <span className="text-[#8417ff]">Read</span>}
                </div>
            </div>
        )
    }

    const renderChannelMessages = (message) => {
        const isMine = sid(message.sender?._id, myUserId) || sid(message.sender, myUserId);
        const senderInitial =
            message.sender?.firstName?.charAt(0) ||
            message.sender?.email?.charAt(0) ||
            "?";
        return (
            <div data-msg-id={message._id} className={`mt-5 ${isMine ? "text-right" : "text-left"}`}>
                {renderReplySnippet(message.replyTo)}
                {
                    message.messageType === "text" && (
                        <div className={`${isMine ?
                            "bg-violet-50 border-violet-300 text-violet-950 dark:bg-[#8417ff]/5 dark:text-[#8417ff]/90 dark:border-[#8417ff]/50" :
                            "bg-neutral-100 border-neutral-200 text-neutral-900 dark:bg-[#2a2b33]/5 dark:text-white/80 dark:border-white/20"} border inline-block p-4 rounded-lg my-1 max-w-[50%] break-words ml-9 shadow-sm chat-message-enter`}>
                            {message.isDeleted ? <span className="italic opacity-60">Message deleted</span> : message.content}
                            {message.editedAt && !message.isDeleted && <span className="text-[10px] opacity-50"> (edited)</span>}
                        </div>
                    )
                }
                {
                    message.messageType === "file" && !message.isDeleted && (
                        <div className={`${isMine ?
                            "bg-violet-50 border-violet-300 text-violet-950 dark:bg-[#8417ff]/5 dark:text-[#8417ff]/90 dark:border-[#8417ff]/50" :
                            "bg-neutral-100 border-neutral-200 text-neutral-900 dark:bg-[#2a2b33]/5 dark:text-white/80 dark:border-white/20"} border inline-block p-4 rounded-lg my-1 max-w-[50%] break-words shadow-sm chat-message-enter`}>
                            {checkIfImage(message.fileUrl) ?
                                <div className='cursor-pointer'
                                    onClick={() => {
                                        setShowImage(true);
                                        setImageUrl(message.fileUrl)
                                    }}
                                >
                                    <img src={`${HOST}/${message.fileUrl}`} alt="" height={300} width={300}></img>
                                </div> :
                                <div className='flex items-center justify-center gap-4'>
                                    <span className='text-foreground/40 dark:text-white/8- text-3xl bg-black/10 dark:bg-black/20 rounded-full p-3'>
                                        <MdFolderZip />
                                    </span>
                                    <span>
                                        {message.fileUrl.split('/').pop()}
                                    </span>
                                    <span className='bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300'
                                        onClick={() => downloadFile(message.fileUrl)}>
                                        <IoMdArrowRoundDown />
                                    </span>
                                </div>}
                        </div>
                    )
                }
                {renderReactions(message, isMine)}
                {renderActions(message, isMine)}
                {
                    !isMine ?
                        (
                            <div className='flex items-center justify-start gap-3'>
                                <Avatar className='h-8 w-8 rounded-full overflow-hidden'>
                                    {
                                        message.sender.image &&
                                        (
                                            <AvatarImage src={`${HOST}/${message.sender.image}`} alt="avatar" className="object-cover w-full h-full bg-black rounded-full" />
                                        )
                                    }

                                    {
                                        <AvatarFallback className={`uppercase h-8 w-8 text-lg flex items-center justify-center rounded-full ${getColor(message.sender?.color)}`} >
                                            {senderInitial}
                                        </AvatarFallback>
                                    }
                                </Avatar>
                                <span className='text-sm text-muted-foreground dark:text-white/60'>
                                    {message.sender?.firstName
                                        ? `${message.sender.firstName}${message.sender.lastName ? ` ${message.sender.lastName}` : ""}`
                                        : message.sender?.email || "User"}
                                </span>
                                <span className='text-sm text-muted-foreground dark:text-white/60'>
                                    {
                                        moment(message.timestamp).format("LT")
                                    }
                                </span>
                            </div>
                        )
                        :
                        (
                            <div className='text-sm text-muted-foreground dark:text-white/60 mt-1'>
                                {moment(message.timestamp).format("LT")}
                                {(() => {
                                    const readers = getChannelReaderNames(message);
                                    if (!readers.length) return null;
                                    const label = readers.length > 2
                                        ? `Seen by ${readers.slice(0, 2).join(", ")} +${readers.length - 2}`
                                        : `Seen by ${readers.join(", ")}`;
                                    return (
                                        <span className="block text-[11px] text-[#8417ff] mt-0.5">{label}</span>
                                    );
                                })()}
                            </div>
                        )
                }
            </div>
        )
    }

    const renderMessages = () => {
        let lastDate = null;
        return selectedChatMessages?.map((message) => {
            const messageDate = moment(message.timestamp).format("YYYY-MM-DD");
            const showDate = messageDate !== lastDate;
            lastDate = messageDate;
            return (
                <div key={message._id}>
                    {showDate &&
                        <div className='text-center text-muted-foreground dark:text-gray-500 my-2'>
                            {moment(message.timestamp).format("LL")}
                        </div>
                    }
                    {selectedChatType === "contact" && renderDMMessages(message)}
                    {selectedChatType === "channel" && renderChannelMessages(message)}
                </div>
            )
        })
    }

    return (
        <>
            {typingLabel() && (
                <div className="px-3 md:px-6 py-1.5 border-b border-chat-border bg-chat-elevated shrink-0">
                    <div className="text-xs text-muted-foreground truncate">{typingLabel()}</div>
                </div>
            )}
            <div
                ref={listRef}
                onScroll={handleListScroll}
                className="flex-1 overflow-y-auto scrollbar-hidden p-4 px-6 md:px-10 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full bg-chat-surface text-foreground transition-colors duration-300"
            >
                {loadingOlderMessages && (
                    <div className="text-center text-xs text-muted-foreground py-2">Loading older messages…</div>
                )}
                {!loadingOlderMessages && hasMoreMessages && (
                    <div className="text-center text-xs text-muted-foreground py-2">Scroll up for older messages</div>
                )}
                {renderMessages()}
                <div ref={scrollRef} />
                {
                    showImage && (
                        <div className='fixed z-[1000] top-0 left-0 h-[100vh] w-[100vw] flex items-center justify-center backdrop-blur-md bg-black/40 animate-in fade-in duration-200'>
                            <div className="animate-in zoom-in-95 duration-200">
                                <img src={`${HOST}/${imageUrl}`} className='h-[80vh] w-full max-w-[95vw] object-contain rounded-lg shadow-2xl' alt="" />
                            </div>
                            <div className='flex gap-3 fixed top-6'>
                                <button type="button" className='bg-black/40 text-white p-3 text-xl rounded-full hover:bg-black/60 border border-white/10 transition-colors'
                                    onClick={() => downloadFile(imageUrl)}
                                >
                                    <IoMdArrowRoundDown />
                                </button>
                                <button type="button" className='bg-black/40 text-white p-3 text-xl rounded-full hover:bg-black/60 border border-white/10 transition-colors'
                                    onClick={() => {
                                        setShowImage(false);
                                        setImageUrl(null);
                                    }}
                                >
                                    <IoCloseSharp />
                                </button>
                            </div>
                        </div>
                    )
                }
            </div>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="bg-popover border border-border text-popover-foreground sm:max-w-md animate-in zoom-in-95 duration-200">
                    <DialogHeader>
                        <DialogTitle>Edit message</DialogTitle>
                    </DialogHeader>
                    <textarea className="w-full min-h-[100px] bg-muted border border-border rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-[#8417ff]/50" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                    <button type="button" className="w-full bg-[#8417ff] hover:bg-[#741bda] text-white px-4 py-2 rounded-lg font-medium transition-colors" onClick={saveEdit}>Save</button>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default MessageContainer
