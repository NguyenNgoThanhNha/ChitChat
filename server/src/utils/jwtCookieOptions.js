/**
 * JWT httpOnly cookie options.
 * - On HTTP (typical LAN / mobile dev): Secure cookies are rejected → session lost on refresh.
 * - Use Secure + SameSite=None only when JWT_COOKIE_SECURE=true or in production (HTTPS).
 */
export function getJwtCookieOptions() {
    const explicit = String(process.env.JWT_COOKIE_SECURE || "").toLowerCase();
    let secure = false;
    if (explicit === "true") secure = true;
    else if (explicit === "false") secure = false;
    else secure = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        path: "/",
        secure,
        sameSite: secure ? "none" : "lax"
    };
}

/** Allowed browser origins (comma-separated in ORIGIN). */
export function getAllowedOrigins() {
    const raw = process.env.ORIGIN || "http://localhost:5173";
    return raw
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
}
