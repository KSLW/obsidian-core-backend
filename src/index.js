import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";

import { connectMongo } from "./config/database.js";
import { createEventBus } from "./core/eventBus.js";
import { logSystemEvent } from "./core/logger.js";
import { autoSeedAll } from "./setup/autoSeed.js";
import { provisionDefaultsForStreamer } from "./utils/provisionDefaults.js";
import { Streamer } from "./models/Streamer.js";

import authRoutes from "./routes/auth.js";
import twitchEventSubRoutes from "./routes/twitchEventSub.js";
import automationsRoutes from "./routes/automations.js";

import { attachAutomationListeners } from "./engine/automationEngine.js";
import { initTwitch } from "./modules/twitch/index.js";
import { startTokenRefreshLoop } from "./modules/twitch/auth.js";

dotenv.config({ path: process.env.ENV_PATH || ".env" });

const app = express();
const server = http.createServer(app);

// middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

// health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/twitch/eventsub", twitchEventSubRoutes);
app.use("/api/automations", automationsRoutes);

// event bus
const WS_PORT = Number(process.env.WS_PORT || 3002);
createEventBus(WS_PORT);
attachAutomationListeners();

// boot
const PORT = Number(process.env.PORT || 3000);
await connectMongo();
await autoSeedAll();

// provision defaults (idempotent) if your main streamer exists
const main = await Streamer.findOne({ twitchUsername: "logicallysleepy" });
if (main) {
  await provisionDefaultsForStreamer(main._id.toString());
}

server.listen(PORT, async () => {
  console.log(`🌍 Server listening on port ${PORT}`);
  try {
    await initTwitch();
    startTokenRefreshLoop();
  } catch (e) {
    console.error("Twitch init error:", e?.message || e);
  }
  await logSystemEvent("backend_boot", { port: PORT, ws: WS_PORT });
});

// graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Received SIGINT, shutting down gracefully...");
  process.exit(0);
});
