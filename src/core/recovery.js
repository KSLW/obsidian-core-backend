// ────────────────────────────────
//  Recovery Manager
// ────────────────────────────────
import { Streamer } from "../models/Streamer.js";
import { initTwitch } from "../modules/twitch/index.js";
import { initDiscord } from "../modules/discord/index.js";
import { initOBS } from "../modules/obs/index.js"; // if you have OBS
import { logSystemEvent } from "./logger.js";

export async function restoreConnections() {
  try {
    const streamers = await Streamer.find({});

    if (!streamers.length) {
      console.log("⚠️ No streamers found — skipping restore.");
      return;
    }

    console.log(`🧩 Attempting to restore ${streamers.length} streamer(s)...`);

    for (const s of streamers) {
      // ─ Twitch
      if (s.twitchAuth?.accessToken) {
        try {
          console.log(`🟣 Restoring Twitch for ${s.displayName}...`);
          await initTwitch(s.ownerId);
          logSystemEvent("twitch_restore", { user: s.displayName });
        } catch (err) {
          console.warn(`⚠️ Twitch restore failed for ${s.displayName}:`, err.message);
        }
      }

      // ─ Discord
      if (s.discordAuth?.accessToken) {
        try {
          console.log(`💬 Restoring Discord for ${s.displayName}...`);
          await initDiscord(s.ownerId);
          logSystemEvent("discord_restore", { user: s.displayName });
        } catch (err) {
          console.warn(`⚠️ Discord restore failed for ${s.displayName}:`, err.message);
        }
      }

      // ─ OBS
      try {
        console.log(`🎥 Restoring OBS connection...`);
        await initOBS();
      } catch (err) {
        console.warn("⚠️ OBS restore skipped:", err.message);
      }
    }

    console.log("✅ All available connections restored.");
  } catch (err) {
    console.error("❌ Recovery failed:", err.message);
  }
}
