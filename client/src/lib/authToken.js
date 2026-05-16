/** Session token for in-app browsers (e.g. Messenger) that drop cross-site cookies on reload. */
const KEY = "syncronus_auth_jwt";

export function getAuthToken() {
    if (typeof sessionStorage === "undefined") return null;
    try {
        return sessionStorage.getItem(KEY);
    } catch {
        return null;
    }
}

export function setAuthToken(token) {
    if (typeof sessionStorage === "undefined" || !token) return;
    try {
        sessionStorage.setItem(KEY, token);
    } catch {
        /* quota / private mode */
    }
}

export function clearAuthToken() {
    if (typeof sessionStorage === "undefined") return;
    try {
        sessionStorage.removeItem(KEY);
    } catch {
        /* ignore */
    }
}
