// src/index.js
// ─────────────────────────────────────────────
//  OBSIDIAN-CORE BACKEND ENTRY POINT
// ─────────────────────────────────────────────

import dotenv from "dotenv";
dotenv.config({ path: process.env.ENV_PATH || ".env" }); // Load env first!

import express from "express";
import http from "http";
import cors from "cors";

//config imports
import { connectMongo } from "./config/database.js";

//core imports
import { createEventBus } from "./core/eventBus.js";
import { logSystemEvent } from "./core/logger.js";

//model imports
import { Streamer } from "./models/Streamer.js";

//utility imports
import { provisionDefaultsForStreamer } from "./utils/provisionDefaults.js";

//setup imports
import { autoSeedAll } from "./setup/autoSeed.js";

//module imports
import { startTokenRefreshLoop } from "./modules/twitch/auth.js";
import { initTwitch } from "./modules/twitch/index.js";
import { initOBS } from "./modules/obs/index.js";


//route imports
import authRoutes from "./routes/auth.js";
import twitchEventSubRoutes from "./routes/twitchEventSub.js";
import automationsRoutes from "./routes/automations.js";
import commandsRoutes from "./routes/commands.js";
import metadataRoutes from "./routes/metadata.js";

//engine imports
import { attachAutomationListeners } from "./engine/automationEngine.js";

//middleware imports
import { errorHandler } from "./middleware/errorHandler.js";

// ─────────────────────────────────────────────
// Express + HTTP Server Setup
// ─────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(errorHandler);

// Healthcheck
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, uptime: process.uptime() })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/twitch/eventsub", twitchEventSubRoutes);
app.use("/api/automations", automationsRoutes);
app.use("/api/commands", commandsRoutes);
app.use("/api/metadata", metadataRoutes);

// ─────────────────────────────────────────────
// WebSocket Event Bus
// ─────────────────────────────────────────────
const WS_PORT = Number(process.env.WS_PORT || 3002);
createEventBus(WS_PORT);
attachAutomationListeners();

// ─────────────────────────────────────────────
// Core Boot Sequence
// ─────────────────────────────────────────────
const PORT = Number(process.env.PORT || 3000);

(async () => {
  try {
    // 1️⃣ Connect to Mongo
    await connectMongo();

    // 2️⃣ Auto-seed commands & automations
    await autoSeedAll();

    // 3️⃣ Find your main streamer
    const mainStreamer = await Streamer.findOne({
      $or: [
        { "twitchBot.username": "logicallysleepy" },
        { "twitchAuth.accessToken": { $exists: true } },
      ],
    });

    // 4️⃣ Provision defaults for main streamer
    if (mainStreamer) {
      console.log(`🧩 Provisioning defaults for ${mainStreamer.twitchBot?.username || "unknown"}`);
      await provisionDefaultsForStreamer(mainStreamer._id.toString());
    } else {
      console.warn("⚠️ No streamer with Twitch credentials found — skipping provisioning");
    }

    // 5️⃣ Start server
    server.listen(PORT, async () => {
      console.log(`🌍 Server listening on port ${PORT}`);

      try {
        // Twitch bot + EventSub setup
        await initTwitch();
        startTokenRefreshLoop();
      } catch (err) {
        console.error("❌ Twitch init error:", err?.response?.data || err?.message || err);
      }

      await logSystemEvent("backend_boot", {
        port: PORT,
        ws: WS_PORT,
        environment: process.env.NODE_ENV || "development",
      });
    });
  } catch (err) {
    console.error("🚨 Fatal boot error:", err.message);
    process.exit(1);
  }

   try {
    await initOBS();
    await initTwitch();
  } catch (e) {
    console.error("Init error:", e?.message || e);
  }

  await logSystemEvent("backend_boot", { port: PORT, ws: WS_PORT });


})();

// ─────────────────────────────────────────────
// Graceful Shutdown (Render / Ctrl+C)
// ─────────────────────────────────────────────
process.on("SIGINT", async () => {
  console.log("🛑 Received SIGINT, shutting down gracefully...");
  process.exit(0);
});
