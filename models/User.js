import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },

  // verification
  isVerified: { type: Boolean, default: false },
  otp: { type: String }, // short-lived OTP (or you can store hash)
  otpExpiresAt: { type: Date },

  history: [
    {
      action: { type: String, required: true },
      item: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
      details: { type: String },
      at: { type: Date, default: Date.now },
    },
  ],
  // profile photo URL (S3 or local)
  photoUrl: { type: String },
});

export default mongoose.models.User || mongoose.model("User", userSchema);
