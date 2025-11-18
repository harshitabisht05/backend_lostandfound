const express = require("express");
const router = express.Router();
const multer = require("multer");
const Item = require("../models/Item");

// Multer setup for memory storage (to convert image to base64)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET all items
router.get("/", async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST a new item
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { itemName, category, location, date, description, type } = req.body;

    if (!itemName || !category || !location || !date || !type) {
      return res.status(400).json({ error: "Please fill all required fields" });
    }

    const newItem = new Item({
      itemName,
      category,
      location,
      date,
      description,
      type,
      image: req.file ? req.file.buffer.toString("base64") : undefined
    });

    await newItem.save();
    // If the request includes a userId, record this action in that user's history
    if (req.body.userId) {
      try {
        // dynamic import so we don't break mixed-module resolution
        const UserModule = await import("../models/User.js");
        const User = UserModule.default;
        const user = await User.findById(req.body.userId);
        if (user) {
          user.history = user.history || [];
          user.history.push({
            action: "Reported an item",
            item: newItem._id,
            details: `${type} - ${itemName}`,
            at: new Date()
          });
          await user.save();
        }
      } catch (err) {
        // log but don't fail the request if history saving fails
        console.error("Failed to save user history:", err);
      }
    }

    res.status(201).json({ message: "Item reported successfully", item: newItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
