import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Upload config
const MAX_BYTES = Number(process.env.MAX_PHOTO_BYTES || 5 * 1024 * 1024); // 5MB
const uploadDir = process.env.LOCAL_UPLOAD_DIR || path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: MAX_BYTES } });

function isAllowedMime(mime) {
  return ["image/jpeg", "image/jpg", "image/png"].includes(mime);
}

// POST /api/user/upload-photo
router.post("/upload-photo", auth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: "No file provided" });
    if (!isAllowedMime(req.file.mimetype)) return res.status(400).json({ ok: false, error: "Invalid file type" });

    // sanitize/resize using sharp
    const id = uuidv4();
    const filename = `${id}.jpg`;
    const outPath = path.join(uploadDir, filename);

    // Resize to 512x512 and convert to jpg
    await sharp(req.file.buffer).resize(512, 512, { fit: "cover" }).jpeg({ quality: 85 }).toFile(outPath);

    // In prod you would upload to S3 and create a public URL. For dev we'll use LOCAL_UPLOAD_DIR
    const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const photoUrl = `${base}/uploads/${filename}`;

    // update user
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });
    user.photoUrl = photoUrl;
    user.history = user.history || [];
    user.history.push({ action: "UploadPhoto", details: "Profile photo updated" });
    await user.save();

    return res.json({ ok: true, photoUrl });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ ok: false, error: "File too large" });
    console.error("upload-photo error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
