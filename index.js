// backend/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth.routes");

const app = express();

const cors = require("cors");

const allowedOrigins = [
  process.env.FRONTEND_URL,          // your deployed dashboard
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // mobile apps, curl, etc.
      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.log("❌ BLOCKED BY CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);


app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api", authRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
