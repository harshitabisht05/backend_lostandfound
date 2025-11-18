import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }, // signup time
  lastLogin: { type: Date } // last login time
  ,
  // history of user actions (signup, login, created items, claimed items, etc.)
  history: [
    {
      action: { type: String, required: true },
      item: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
      details: { type: String },
      at: { type: Date, default: Date.now }
    }
  ]
});

export default mongoose.model("User", userSchema);