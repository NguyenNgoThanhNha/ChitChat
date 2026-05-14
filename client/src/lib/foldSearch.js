/** Khớp với server/src/utils/textSearch.js — tìm trong danh sách tin đang mở */
export function foldSearchText(str) {
    if (!str) return "";
    const s = String(str).normalize("NFD");
    try {
        return s
            .replace(/\p{M}/gu, "")
            .replace(/đ/gi, (c) => (c === "đ" ? "d" : "d"))
            .toLowerCase();
    } catch {
        return s
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\u0111/g, "d")
            .replace(/\u0110/g, "d")
            .toLowerCase();
    }
}

export function fileBasename(fileUrl) {
    if (!fileUrl) return "";
    const parts = String(fileUrl).split(/[/\\]/);
    return parts[parts.length - 1] || "";
}

export function messageSearchHaystack(message) {
    const text = message.content || "";
    const file = fileBasename(message.fileUrl);
    return foldSearchText(`${text} ${file}`);
}

export function messageMatchesQuery(message, foldedQuery) {
    if (!foldedQuery) return false;
    if (message.isDeleted) return false;
    return messageSearchHaystack(message).includes(foldedQuery);
}

export function searchMessagesInList(messages, rawQuery) {
    const q = String(rawQuery || "").trim();
    if (!q) return [];
    const fq = foldSearchText(q);
    if (!fq) return [];
    return (messages || []).filter((m) => messageMatchesQuery(m, fq));
}
