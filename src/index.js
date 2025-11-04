// backend/src/index.js
import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { createEventBus } from "./core/eventBus.js";
import { initOBS } from "./modules/obs/index.js";
import { bootstrapCaches } from "./core/bootstrap.js";
import { loadTimers } from "./core/timers.js";
import { initTwitch } from "./modules/twitch/index.js";
import { initDiscord } from "./modules/discord/index.js";

import apiRoutes from "./routes/index.js";
import obsRoutes from "./routes/obs.js";
import authRoutes from "./routes/auth.js";
import streamerStatus from "./routes/streamerStatus.js";
import TwitchEventSub  from "./routes/twitchEventSub.js";

dotenv.config({ path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.local"});

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// Routes
app.use("/api", apiRoutes);
app.use("/api/obs", obsRoutes);
app.use("/api/streamer", streamerStatus);
app.use("/api/auth", authRoutes);
app.use("/api/twitch/eventsub", TwitchEventSub);

// Start WebSocket
const WS_PORT = Number(process.env.WS_PORT || 3002);
createEventBus(WS_PORT);

// Initialize subsystems
await initOBS();
await bootstrapCaches();
await loadTimers();

// Delayed bot startup
setTimeout(() => {
  initTwitch().catch(console.error);
  initDiscord().catch(console.error);
}, 1500);

const PORT = Number(process.env.PORT || 3000);
server.listen(PORT, () => {
  console.log(`🌍 Server listening on port ${PORT}`);
});
