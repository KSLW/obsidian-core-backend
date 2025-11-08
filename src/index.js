import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";

import { createEventBus } from "./core/eventBus.js";
import { initOBS } from "./modules/obs/index.js";
import { initTwitch } from "./modules/twitch/index.js";
import { initDiscord } from "./modules/discord/index.js";
import { bootstrapCaches } from "./core/bootstrap.js";
import { loadTimers } from "./core/timers.js";
import { connectMongo } from "../db/mongo.js";
import { gracefulShutdown } from "./core/shutdown.js";
import {restoreConnections} from "./core/recovery.js";
import { refreshTwitchToken } from "./modules/twitch/auth.js";
import { refreshDiscordToken } from "./modules/discord/index.js";

import authRoutes from "./routes/auth.js";
import obsRoutes from "./routes/obs.js";
import apiRoutes from "./routes/index.js";
import streamerStatusRoutes from "./routes/streamerStatus.js";
import { router as twitchEventSubRoutes } from "./routes/twitchEventSub.js";
import twitchCommandsRoutes from "./routes/twitchCommands.js";
import moderation from "./routes/moderation.js";
import logsRoutes from "./routes/logs.js";

dotenv.config();
await connectMongo();
await restoreConnections();


const app = express();
const server = http.createServer(app);

// CORS (prod-safe; set FRONTEND_URL in env)
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api", apiRoutes);
app.use("/api/obs", obsRoutes);
app.use("/api/streamer", streamerStatusRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/twitch/commands", twitchCommandsRoutes);
app.use("/api/twitch/eventsub", twitchEventSubRoutes);
app.use("/api/twitch", twitchEventSubRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/twitch/commands", twitchCommandsRoutes);
app.use("/api/moderation", moderation);
app.use("/api/logs", logsRoutes);

// WS bus
const WS_PORT = Number(process.env.WS_PORT || 3002);
createEventBus(WS_PORT);

// Start stack
await initOBS().catch(console.error);
await bootstrapCaches().catch(console.error);
await loadTimers().catch(console.error);

// Delay bot init slightly so DB/OBS are ready
setTimeout(async () => {
  try { await initTwitch(); } catch (e) { console.error("Twitch init error:", e); }
  try { await initDiscord(); } catch (e) { console.error("Discord init error:", e); }
}, 800);

const PORT = Number(process.env.PORT || 3000);
server.listen(PORT, () => {
  console.log(`🌍 Server listening on port ${PORT}`);
});

["SIGINT", "SIGTERM", "SIGQUIT"].forEach(sig => {
  process.on(sig, async () => await gracefulShutdown(sig));
});

process.on("uncaughtException", async (err) => {
  console.error("💥 Uncaught Exception:", err);
  await gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", async (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
  await gracefulShutdown("unhandledRejection");
});

setInterval(async () => {
  console.log("🧹 Daily token maintenance...");
  const streamers = await Streamer.find({});
  for (const s of streamers) {
    await refreshTwitchToken(s.ownerId);
    await refreshDiscordToken(s.ownerId);
  }
}, 1000 * 60 * 60 * 24);
