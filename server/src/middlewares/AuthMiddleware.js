import jwt from 'jsonwebtoken';

function readJwtFromRequest(req) {
    const fromCookie = req.cookies?.jwt;
    if (fromCookie) return fromCookie;
    const auth = req.headers?.authorization;
    if (typeof auth === "string" && auth.startsWith("Bearer ")) {
        return auth.slice(7).trim() || null;
    }
    return null;
}

export const verifyToken = (req, res, next) => {
    const token = readJwtFromRequest(req);
    if (!token) return res.status(401).json({ message: "Unauthorized!" });
    jwt.verify(token, process.env.JWT_KEY, async (err, payload) => {
        if (err) return res.status(403).json("Token is not valid");
        req.userId = payload.userId;
        next();
    });
}