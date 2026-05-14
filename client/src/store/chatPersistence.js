const KEY = "syncronus-active-chat";

export const saveActiveChat = (type, id) => {
    if (!type || !id) {
        try {
            localStorage.removeItem(KEY);
        } catch {
            /* ignore */
        }
        return;
    }
    try {
        localStorage.setItem(KEY, JSON.stringify({ type, id: String(id) }));
    } catch {
        /* ignore */
    }
};

export const readActiveChat = () => {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (data && (data.type === "channel" || data.type === "contact") && data.id) {
            return { type: data.type, id: String(data.id) };
        }
    } catch {
        /* ignore */
    }
    return null;
};
