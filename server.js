import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/auth.js";
import itemsRoutes from "./routes/items.js";
import userRoutes from "./routes/user.js";

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded files in development from /uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


app.use("/api/auth", authRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/user", userRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected successfully"))
.catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
