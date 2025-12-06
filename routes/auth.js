import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";
import auth from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 10);

const genOtp = () => String(Math.floor(100000 + Math.random() * 900000)); // 6-digit

// Signup: create user with isVerified=false, send OTP
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({ message: "Missing fields" });

    // optional: enforce UPES student email pattern
    if (!/^[a-zA-Z]+\.[0-9]+@stu\.upes\.ac\.in$/.test(email)) {
      return res.status(400).json({ message: "Use your UPES student email (e.g. name.roll@stu.upes.ac.in)" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const otp = genOtp();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    const newUser = new User({
      fullName,
      email,
      password: hashed,
      isVerified: false,
      otp,
      otpExpiresAt,
    });

    newUser.history = newUser.history || [];
    newUser.history.push({ action: "Signup", details: "User signed up, OTP sent" });
    await newUser.save();

    // send OTP email
    const html = `
      <p>Hi ${fullName},</p>
      <p>Your verification code for L&F Portal is: <b>${otp}</b></p>
      <p>This code will expire in ${OTP_EXPIRES_MINUTES} minutes.</p>
    `;
    try {
      await sendEmail({ to: email, subject: "Your L&F Portal verification code", html });
    } catch (err) {
      console.warn("Failed to send email:", err);
    }

    return res.status(201).json({ message: "User created. OTP sent to email.", email: newUser.email });
  } catch (err) {
    console.error("signup error:", err);
    return res.status(500).json({ message: err.message });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) return res.status(200).json({ message: "Already verified" });

    if (!user.otp || !user.otpExpiresAt) return res.status(400).json({ message: "OTP not set. Please request a new code." });

    if (new Date() > new Date(user.otpExpiresAt)) return res.status(400).json({ message: "OTP expired" });

    if (String(user.otp) !== String(otp)) return res.status(400).json({ message: "Incorrect OTP" });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.history = user.history || [];
    user.history.push({ action: "Verify", details: "Email verified via OTP" });
    await user.save();

    return res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("verify-otp error:", err);
    return res.status(500).json({ message: err.message });
  }
});

// Resend OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    const otp = genOtp();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);
    user.history = user.history || [];
    user.history.push({ action: "Resend OTP", details: "OTP resent" });
    await user.save();

    const html = `<p>Your new verification code is: <b>${otp}</b></p><p>Valid for ${OTP_EXPIRES_MINUTES} minutes.</p>`;
    try { await sendEmail({ to: user.email, subject: "Your L&F Portal verification code (resend)", html }); } catch (e) { console.warn("mail failed", e); }

    return res.json({ message: "OTP resent" });
  } catch (err) {
    console.error("resend-otp error:", err);
    return res.status(500).json({ message: err.message });
  }
});

// Login (only allowed after verification)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) return res.status(403).json({ message: "Please verify your email first (OTP)." });

    user.lastLogin = new Date();
    user.history = user.history || [];
    user.history.push({ action: "Login", details: "User logged in", at: user.lastLogin });
    await user.save();

    const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.json({ message: "Login successful", token, user: { id: user._id, fullName: user.fullName, email: user.email } });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: err.message });
  }
});

// Profile route (protected by token in header)
router.get("/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password -otp -otpExpiresAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      emailVerified: user.isVerified,
      photoUrl: user.photoUrl || undefined,
      lastLogin: user.lastLogin,
      history: user.history || [],
    });
  } catch (err) {
    console.error("profile error:", err);
    return res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }
});

// Re-send verification email (rate-limited)
router.post(
  "/reverify-email",
  auth,
  rateLimit((req) => `reverify:${req.userId}`, { windowMs: 60 * 1000, max: 1 }),
  async (req, res) => {
    try {
      const { email: bodyEmail } = req.body || {};
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ ok: false, error: "User not found" });

      const email = bodyEmail || user.email;
      if (!email) return res.status(400).json({ ok: false, error: "Email required" });
      if (user.isVerified) return res.status(400).json({ ok: false, error: "Email already verified" });

      // signed short-lived token
      const token = jwt.sign({ id: user._id, type: "verify_email" }, process.env.JWT_SECRET, { expiresIn: process.env.REVERIFY_EXPIRES || "15m" });
      const callbackBase = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const verifyUrl = `${callbackBase}/verify-email?token=${token}`;

      const html = `<p>Click to verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`;

      // send email but don't fail if mailer fails in dev — still respond success but log
      try {
        await sendEmail({ to: email, subject: "Verify your L&F Portal email", html });
      } catch (err) {
        console.warn("reverify-email mail failed, token: ", token);
      }

      user.history = user.history || [];
      user.history.push({ action: "ReverifyEmail", details: "Verification email requested" });
      await user.save();

      return res.json({ ok: true, message: "Verification email queued" });
    } catch (err) {
      console.error("reverify-email error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
);

// Change password (auth required + rate-limit)
router.post(
  "/change-password",
  auth,
  rateLimit((req) => `changepwd:${req.userId}`, { windowMs: 60 * 1000, max: 5 }),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) return res.status(400).json({ ok: false, error: "Missing fields" });
      if (typeof newPassword !== "string" || newPassword.length < 8)
        return res.status(400).json({ ok: false, error: "New password must be at least 8 characters" });

      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ ok: false, error: "User not found" });

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        user.history = user.history || [];
        user.history.push({ action: "ChangePasswordFail", details: "Incorrect current password" });
        await user.save();
        return res.status(400).json({ ok: false, error: "Current password incorrect" });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      user.password = hashed;
      user.history = user.history || [];
      user.history.push({ action: "ChangePassword", details: "Password changed" });
      await user.save();

      // TODO: invalidate tokens / sessions by rotating a server-side value (not implemented here)

      return res.json({ ok: true, message: "Password changed" });
    } catch (err) {
      console.error("change-password error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
);

export default router;
