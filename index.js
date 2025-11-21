const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");

const app = express();

/**
 * CORS FIX: works on Render + Vercel + localhost
 */
const allowedOrigins = [
  process.env.FRONTEND_URL?.replace(/\/$/, ""), // remove trailing slash
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

console.log("Allowed origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        // curl, postman, mobile, server → OK
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      console.log("❌ BLOCKED ORIGIN:", origin);
      return callback(new Error("CORS Not allowed"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// REQUIRED for browser preflight
app.options("*", cors());

app.use(bodyParser.json());

// --- ROUTES ---
app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", authRoutes);

// --- START ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
