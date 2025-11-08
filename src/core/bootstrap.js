// backend/src/core/bootstrap.js
import { Streamer } from "../models/Streamer.js";
import { setCommands, setTwitchCommands } from "./registry.js";
import { initTwitch, registerEventSubRedemption } from "../modules/twitch/index.js";
import { initDiscord } from "../modules/discord/index.js";

/**
 * Bootstraps all known streamers from the database.
 * Rebuilds in-memory caches and ensures Twitch EventSub hooks are registered.
 */
export async function bootstrapCaches() {
  try {
    const streamers = await Streamer.find({});
    if (!streamers || streamers.length === 0) {
      console.warn("⚠️ No streamers found — nothing to bootstrap yet.");
      return;
    }

    console.log(`📚 Cache primed for ${streamers.length} streamer(s) with Twitch + automations.`);

    for (const s of streamers) {
      const id = s._id || s.ownerId || "global";

      // ✅ Twitch commands
      if (s.twitchCommands?.length) {
        setTwitchCommands(id, s.twitchCommands);
      }

      // ✅ Generic commands
      if (s.commands?.length) {
        setCommands(id, s.commands);
      }

      // ✅ Reconnect Twitch
      if (s.twitchAuth?.accessToken) {
        console.log(`🟣 Auto-connecting Twitch for ${s.displayName}`);
        await initTwitch();

        // 👇 Auto re-register EventSub
        console.log(`🔄 Ensuring EventSub for ${s.displayName}`);
        await registerEventSubRedemption(s.ownerId, s.twitchAuth.accessToken);
      }

      // ✅ Reconnect Discord
      if (s.discordAuth?.accessToken) {
        console.log(`💬 Auto-connecting Discord for ${s.displayName}`);
        await initDiscord();
      }
    }

  } catch (err) {
    console.error("❌ bootstrapCaches failed:", err.message);
  }
}
