// backend/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth.routes");

const app = express();

// ---------------------
// CORS SETTINGS
// ---------------------
const allowedOrigins = [
  process.env.FRONTEND_URL,      // deployed frontend
  "http://localhost:3000",       // local dev fallback
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // mobile / curl / server
      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.log("❌ CORS BLOCKED:", origin);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Parse JSON
app.use(bodyParser.json());

// ---------------------
// ROUTES
// ---------------------
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// OAuth + Settings routes
app.use("/api", authRoutes);

// ---------------------
// START SERVER
// ---------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
  console.log("TWITCH_REDIRECT_URI:", process.env.TWITCH_REDIRECT_URI);
  console.log("DISCORD_REDIRECT_URI:", process.env.DISCORD_REDIRECT_URI);
});
