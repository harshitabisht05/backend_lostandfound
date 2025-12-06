import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Express middleware to verify JWT Bearer token and attach user id to req.userId
export default function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ ok: false, error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) return res.status(401).json({ ok: false, error: "Invalid token" });

    // attach user id and whole payload for downstream handlers
    req.userId = decoded.id;
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }
}
