import mongoose from "mongoose";
import { isTwitchConnected } from "../modules/twitch/index.js";
import { client as discordClient } from "../modules/discord/index.js"; // adjust import if needed
import { obs } from "../modules/obs/index.js"; // your OBS connection object

export async function gracefulShutdown(signal = "SIGTERM") {
  console.log(`🛑 Received ${signal}, shutting down gracefully...`);

  // Twitch disconnect
  try {
    if (isTwitchConnected()) {
      console.log("🔌 Disconnecting Twitch bot...");
      const { default: tmi } = await import("tmi.js");
      tmi.Client?.disconnect?.();
    }
  } catch (err) {
    console.warn("⚠️ Failed to close Twitch:", err.message);
  }

  // Discord disconnect
  try {
    if (discordClient?.isReady()) {
      console.log("🔌 Disconnecting Discord bot...");
      await discordClient.destroy();
    }
  } catch (err) {
    console.warn("⚠️ Failed to close Discord:", err.message);
  }

  // OBS disconnect
  try {
    if (obs?.connected) {
      console.log("🎥 Disconnecting OBS WebSocket...");
      await obs.disconnect();
    }
  } catch (err) {
    console.warn("⚠️ Failed to close OBS:", err.message);
  }

  // Mongo disconnect
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("🍃 Closing MongoDB connection...");
      await mongoose.disconnect();
    }
  } catch (err) {
    console.warn("⚠️ Failed to close Mongo:", err.message);
  }

  console.log("✅ All services closed — exiting process.");
  process.exit(0);
}
