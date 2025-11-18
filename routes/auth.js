import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, email, password: hashed });
  // Add a signup history event
  newUser.history = newUser.history || [];
  newUser.history.push({ action: "Signup", details: "User signed up" });
  await newUser.save();

    // Create JWT token
    const token = jwt.sign({ id: newUser._id, email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      message: "User created successfully",
      token,
      user: { id: newUser._id, fullName: newUser.fullName, email: newUser.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Update last login time
    user.lastLogin = new Date();
  // Record login in history
  user.history = user.history || [];
  user.history.push({ action: "Login", details: "User logged in", at: user.lastLogin });
  await user.save();

    // Create JWT
    const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Profile Route (Protected)
router.get("/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      lastLogin: user.lastLogin,
      history: user.history || []
    });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

export default router;
