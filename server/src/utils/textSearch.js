/**
 * Chuẩn hóa chuỗi để so khớp "không dấu", không phân biệt hoa thường (tiếng Việt + Latin).
 */
export function foldSearchText(str) {
    if (!str) return "";
    const s = String(str).normalize("NFD");
    try {
        return s
            .replace(/\p{M}/gu, "")
            .replace(/đ/gi, () => "d")
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

export function queryMatchesFoldedHaystack(message, foldedQuery) {
    if (!foldedQuery) return false;
    return messageSearchHaystack(message).includes(foldedQuery);
}
