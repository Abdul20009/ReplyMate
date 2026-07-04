const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth_routes");
const contactRoutes = require("./routes/contact_routes");
const suggestionRoutes = require("./routes/suggestion_routes");

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// ─── Health check ───────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "ReplyMate backend is running" });
});

// ─── Routes ─────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/suggest", suggestionRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});