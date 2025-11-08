// src/index.js
import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";

import { connectMongo } from "./config/database.js";
import { createEventBus } from "./core/eventBus.js";
import { logSystemEvent } from "./core/logger.js";
import { autoSeedAll} from "./setup/autoSeed.js";

import authRoutes from "./routes/auth.js";
import twitchEventSubRoutes from "./routes/twitchEventSub.js";
import automationsRoutes from "./routes/automations.js";
import { attachAutomationListeners } from "./engine/automationEngine.js";

import { initTwitch } from "./modules/twitch/index.js";

dotenv.config({ path: process.env.ENV_PATH || ".env" });

const app = express();
const server = http.createServer(app);

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/twitch/eventsub", twitchEventSubRoutes);
app.use("/api/automations", automationsRoutes);

// WebSocket Event Bus
const WS_PORT = Number(process.env.WS_PORT || 3002);
createEventBus(WS_PORT);
attachAutomationListeners();

// Boot
const PORT = Number(process.env.PORT || 3000);
await connectMongo();
await autoSeedAll();

server.listen(PORT, async () => {
  console.log(`🌍 Server listening on port ${PORT}`);

  // Twitch bot + EventSub bootstrap
  try {
    await initTwitch();
  } catch (e) {
    console.error("Twitch init error:", e.message);
  }

  await logSystemEvent("backend_boot", { port: PORT, ws: WS_PORT });
});

// graceful shutdown (Ctrl+C / Render stop)
process.on("SIGINT", async () => {
  console.log("🛑 Received SIGINT, shutting down gracefully...");
  process.exit(0);
});