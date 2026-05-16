/**
 * JWT backup when httpOnly cookie is dropped (Messenger WebView, strict mobile Safari, etc.).
 * Persists in localStorage (survives reload reliably) and sessionStorage when available.
 */
const KEY = "syncronus_auth_jwt";

export function getAuthToken() {
    if (typeof window === "undefined") return null;
    try {
        return localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
    } catch {
        try {
            return sessionStorage.getItem(KEY);
        } catch {
            return null;
        }
    }
}

export function setAuthToken(token) {
    if (typeof window === "undefined" || !token) return;
    try {
        localStorage.setItem(KEY, token);
    } catch {
        /* private mode / quota */
    }
    try {
        sessionStorage.setItem(KEY, token);
    } catch {
        /* ignore */
    }
}

export function clearAuthToken() {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(KEY);
    } catch {
        /* ignore */
    }
    try {
        sessionStorage.removeItem(KEY);
    } catch {
        /* ignore */
    }
}
