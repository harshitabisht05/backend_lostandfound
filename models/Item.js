const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String },
  type: { type: String, enum: ["lost", "found"], required: true },
  image: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Item", itemSchema);
