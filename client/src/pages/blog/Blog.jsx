import { apiClient } from "@/lib/api.client";
import { useAppStore } from "@/store/store";
import {
    BLOG_POSTS_ROUTE,
    BLOG_POST_LIKE_ROUTE,
    BLOG_POST_COMMENTS_ROUTE,
    BLOG_POST_SHARE_ROUTE,
    BLOG_POST_DELETE_ROUTE,
    HOST,
    UPLOAD_FILE_ROUTE
} from "@/utils/constant";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getColor } from "@/lib/utils";
import moment from "moment";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useConfirmUi } from "@/store/confirm-ui";
import { FaRegCommentDots, FaRegHeart, FaHeart } from "react-icons/fa";
import { FiShare2, FiArrowLeft, FiSend, FiPaperclip, FiX } from "react-icons/fi";
import { IoTrashOutline } from "react-icons/io5";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { AnimatedPage, AnimatedPageHeader, AnimatedPageMain, staggerStyle } from "@/components/layout/AnimatedPage";

const extOf = (path) => {
    const n = String(path).split(/[/\\]/).pop() || "";
    const i = n.lastIndexOf(".");
    return i >= 0 ? n.slice(i + 1).toLowerCase() : "";
};

const classifyPath = (path) => {
    const ext = extOf(path);
    if (/^(mp4|webm|mov|mkv|ogg|m4v)$/i.test(ext)) return "videos";
    if (/^(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif)$/i.test(ext)) return "images";
    return "files";
};

const emptyMedia = () => ({ images: [], videos: [], files: [] });

const PostMedia = ({ post }) => {
    const imgs = post.images || [];
    const vids = post.videos || [];
    const docs = post.files || [];
    if (!imgs.length && !vids.length && !docs.length) return null;
    return (
        <div className="mt-3 space-y-3">
            {imgs.length > 0 && (
                <div className="grid gap-2">
                    {imgs.map((img) => (
                        <img key={img} src={`${HOST}/${img}`} alt="" className="rounded-lg max-h-72 w-full object-cover border border-border" />
                    ))}
                </div>
            )}
            {vids.length > 0 && (
                <div className="grid gap-2">
                    {vids.map((v) => (
                        <video key={v} controls className="rounded-lg max-h-80 w-full border border-border bg-black" src={`${HOST}/${v}`} />
                    ))}
                </div>
            )}
            {docs.length > 0 && (
                <ul className="space-y-1.5 text-sm">
                    {docs.map((f) => {
                        const name = f.split("/").pop() || f;
                        return (
                            <li key={f}>
                                <a href={`${HOST}/${f}`} download={name} className="text-[#8417ff] hover:underline break-all" target="_blank" rel="noreferrer">
                                    {name}
                                </a>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

const Blog = () => {
    const navigate = useNavigate();
    const { userInfo } = useAppStore();
    const [searchParams] = useSearchParams();
    const focusId = searchParams.get("post");
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [newContent, setNewContent] = useState("");
    const [pendingMedia, setPendingMedia] = useState(emptyMedia);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [expanded, setExpanded] = useState({});
    const [commentsByPost, setCommentsByPost] = useState({});

    const loadPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(BLOG_POSTS_ROUTE, { params: { page: 1, limit: 20 }, withCredentials: true });
            setPosts(res.data.posts || []);
        } catch {
            toast.error("Could not load feed");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    useEffect(() => {
        if (!focusId || loading) return;
        const el = document.getElementById(`post-${focusId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [focusId, loading, posts]);

    const addUploadedPath = (path) => {
        if (!path) return;
        const kind = classifyPath(path);
        setPendingMedia((pm) => {
            const next = { ...pm, [kind]: [...pm[kind], path] };
            if (next.images.length > 8) next.images = next.images.slice(0, 8);
            if (next.videos.length > 6) next.videos = next.videos.slice(0, 6);
            if (next.files.length > 8) next.files = next.files.slice(0, 8);
            return next;
        });
    };

    const removePending = (kind, index) => {
        setPendingMedia((pm) => ({
            ...pm,
            [kind]: pm[kind].filter((_, i) => i !== index)
        }));
    };

    const onPickFiles = async (e) => {
        const list = e.target.files;
        if (!list?.length) return;
        setUploading(true);
        try {
            for (const file of Array.from(list)) {
                const fd = new FormData();
                fd.append("file", file);
                const res = await apiClient.post(UPLOAD_FILE_ROUTE, fd, {
                    withCredentials: true,
                    headers: { "Content-Type": "multipart/form-data" }
                });
                const p = res.data?.filePath;
                if (p) addUploadedPath(p);
            }
        } catch {
            toast.error("Upload thất bại");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const toggleLike = async (post) => {
        try {
            const res = await apiClient.post(BLOG_POST_LIKE_ROUTE(post._id), {}, { withCredentials: true });
            const p = res.data.post;
            const id = String(p._id ?? p.id);
            setPosts((prev) =>
                prev.map((x) =>
                    String(x._id) === id
                        ? {
                              ...x,
                              ...p,
                              likedByMe: res.data.liked,
                              likesCount: res.data.likesCount
                          }
                        : x
                )
            );
        } catch {
            toast.error("Like failed");
        }
    };

    const sharePost = async (post) => {
        try {
            const res = await apiClient.post(BLOG_POST_SHARE_ROUTE(post._id), {}, { withCredentials: true });
            const url = res.data.shareUrl || `${window.location.origin}/blog?post=${post._id}`;
            await navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard");
            setPosts((prev) => prev.map((x) => (x._id === post._id ? { ...x, sharesCount: res.data.post.sharesCount } : x)));
        } catch {
            toast.error("Share failed");
        }
    };

    const loadComments = async (postId) => {
        try {
            const res = await apiClient.get(BLOG_POST_COMMENTS_ROUTE(postId), { withCredentials: true });
            setCommentsByPost((m) => ({ ...m, [postId]: res.data.comments || [] }));
        } catch {
            toast.error("Could not load comments");
        }
    };

    const toggleComments = (postId) => {
        setExpanded((e) => ({ ...e, [postId]: !e[postId] }));
        if (!commentsByPost[postId] && !expanded[postId]) loadComments(postId);
    };

    const sendComment = async (postId, text) => {
        const t = text.trim();
        if (!t) return;
        try {
            await apiClient.post(BLOG_POST_COMMENTS_ROUTE(postId), { content: t }, { withCredentials: true });
            await loadComments(postId);
            setPosts((prev) => prev.map((x) => (x._id === postId ? { ...x, commentsCount: (x.commentsCount || 0) + 1 } : x)));
        } catch {
            toast.error("Comment failed");
        }
    };

    const createPost = async () => {
        const text = newContent.trim();
        const { images, videos, files } = pendingMedia;
        if (!text && !images.length && !videos.length && !files.length) {
            toast.message("Thêm nội dung hoặc đính kèm file");
            return;
        }
        try {
            await apiClient.post(
                BLOG_POSTS_ROUTE,
                { content: text, images, videos, files },
                { withCredentials: true }
            );
            setNewContent("");
            setPendingMedia(emptyMedia());
            setCreateOpen(false);
            toast.success("Đã đăng");
            loadPosts();
        } catch {
            toast.error("Không đăng được");
        }
    };

    const deletePost = async (post) => {
        const ok = await useConfirmUi.getState().show({
            title: "Xóa bài viết?",
            description: "Bài và bình luận liên quan sẽ bị xóa vĩnh viễn.",
            destructive: true
        });
        if (!ok) return;
        try {
            await apiClient.delete(BLOG_POST_DELETE_ROUTE(post._id), { withCredentials: true });
            setPosts((p) => p.filter((x) => x._id !== post._id));
            toast.success("Deleted");
        } catch {
            toast.error("Delete failed");
        }
    };

    const renderPendingChips = () => {
        const rows = [
            ["images", "Ảnh"],
            ["videos", "Video"],
            ["files", "File"]
        ];
        return (
            <div className="space-y-2">
                {rows.map(([key, label]) =>
                    pendingMedia[key].length ? (
                        <div key={key} className="text-xs text-muted-foreground">
                            <span className="text-muted-foreground">{label}: </span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {pendingMedia[key].map((path, i) => (
                                    <span
                                        key={`${path}-${i}`}
                                        className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-md bg-muted border border-border text-foreground max-w-full"
                                    >
                                        <span className="truncate max-w-[200px]">{path.split("/").pop()}</span>
                                        <button type="button" className="p-0.5 rounded hover:bg-white/10" onClick={() => removePending(key, i)} aria-label="Remove">
                                            <FiX />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : null
                )}
            </div>
        );
    };

    return (
        <AnimatedPage className="min-h-screen">
            <AnimatedPageHeader className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
                <div className="max-w-xl mx-auto flex items-center justify-between px-4 py-3">
                    <button type="button" onClick={() => navigate("/chat")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <FiArrowLeft /> Chat
                    </button>
                    <h1 className="text-lg font-semibold">Blog</h1>
                    <div className="flex items-center gap-2">
                        <ThemeToggleButton />
                        <button type="button" onClick={() => setCreateOpen(true)} className="text-sm font-medium bg-[#8417ff] hover:bg-[#741bda] text-white px-3 py-1.5 rounded-md transition-colors">
                            New post
                        </button>
                    </div>
                </div>
            </AnimatedPageHeader>

            <AnimatedPageMain className="max-w-xl mx-auto px-4 py-6 space-y-4 pb-24">
                {loading && <p className="text-center text-muted-foreground py-10">Loading…</p>}
                {!loading && posts.length === 0 && (
                    <p className="text-center text-muted-foreground py-10">No posts yet. Be the first to share!</p>
                )}
                {posts.map((post, idx) => (
                    <article
                        key={post._id}
                        id={`post-${post._id}`}
                        style={staggerStyle(idx)}
                        className={`page-stagger-item rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow ${focusId === post._id ? "ring-1 ring-violet-500/50" : ""}`}
                    >
                        <div className="flex gap-3">
                            <Avatar className="h-10 w-10 shrink-0">
                                {post.author?.image ? (
                                    <AvatarImage src={`${HOST}/${post.author.image}`} alt="" className="object-cover" />
                                ) : (
                                    <AvatarFallback className={`${getColor(post.author?.color)} text-sm`}>
                                        {(post.author?.firstName || post.author?.email || "?").charAt(0)}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="font-medium text-foreground">
                                            {post.author?.firstName || post.author?.email || "User"}
                                        </span>
                                        <span className="text-muted-foreground text-sm ml-2">{moment(post.createdAt).fromNow()}</span>
                                    </div>
                                    {userInfo?.id && String(post.author?._id) === String(userInfo.id) && (
                                        <button type="button" className="text-muted-foreground hover:text-red-400 p-1" onClick={() => deletePost(post)} aria-label="Delete">
                                            <IoTrashOutline />
                                        </button>
                                    )}
                                </div>
                                {(post.content || "").trim() ? (
                                    <p className="mt-2 text-[15px] leading-relaxed text-foreground whitespace-pre-wrap break-words">{post.content}</p>
                                ) : null}
                                <PostMedia post={post} />
                                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-t border-border pt-3">
                                    <button type="button" className="flex items-center gap-1.5 hover:text-[#8417ff] transition-colors" onClick={() => toggleLike(post)}>
                                        {post.likedByMe ? <FaHeart className="text-[#8417ff]" /> : <FaRegHeart />}
                                        <span>{post.likesCount ?? post.likes?.length ?? 0}</span>
                                    </button>
                                    <button type="button" className="flex items-center gap-1.5 hover:text-foreground transition-colors" onClick={() => toggleComments(post._id)}>
                                        <FaRegCommentDots />
                                        <span>{post.commentsCount ?? 0}</span>
                                    </button>
                                    <button type="button" className="flex items-center gap-1.5 hover:text-foreground transition-colors" onClick={() => sharePost(post)}>
                                        <FiShare2 />
                                        <span>Share{post.sharesCount ? ` · ${post.sharesCount}` : ""}</span>
                                    </button>
                                </div>
                                {expanded[post._id] && (
                                    <div className="mt-3 space-y-3 border-t border-border pt-3">
                                        {(commentsByPost[post._id] || []).map((c) => (
                                            <div key={c._id} className="flex gap-2 text-sm">
                                                <span className="font-medium text-foreground shrink-0">{c.author?.firstName || c.author?.email}:</span>
                                                <span className="text-foreground/80">{c.content}</span>
                                            </div>
                                        ))}
                                        <CommentBox onSubmit={(t) => sendComment(post._id, t)} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </article>
                ))}
            </AnimatedPageMain>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>New post</DialogTitle>
                    </DialogHeader>
                    <textarea
                        className="w-full min-h-[120px] bg-muted border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                        placeholder="Nội dung (có thể để trống nếu chỉ gửi ảnh / video / file)…"
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                    />
                    <input ref={fileInputRef} type="file" multiple className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.zip,.rar,.txt,.ppt,.pptx" onChange={onPickFiles} />
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            disabled={uploading}
                            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-border bg-muted hover:bg-accent text-foreground disabled:opacity-50"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FiPaperclip /> {uploading ? "Đang tải lên…" : "Đính kèm ảnh, video, file"}
                        </button>
                    </div>
                    {renderPendingChips()}
                    <button type="button" className="w-full mt-3 bg-[#8417ff] hover:bg-[#741bda] py-2 rounded-lg font-medium disabled:opacity-50" disabled={uploading} onClick={createPost}>
                        Publish
                    </button>
                </DialogContent>
            </Dialog>
        </AnimatedPage>
    );
};

function CommentBox({ onSubmit }) {
    const [v, setV] = useState("");
    return (
        <div className="flex gap-2">
            <input
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                placeholder="Write a comment…"
                value={v}
                onChange={(e) => setV(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        onSubmit(v);
                        setV("");
                    }
                }}
            />
            <button type="button" className="p-2 rounded-lg bg-[#8417ff] hover:bg-[#741bda]" onClick={() => { onSubmit(v); setV(""); }} aria-label="Send">
                <FiSend />
            </button>
        </div>
    );
}

export default Blog;
