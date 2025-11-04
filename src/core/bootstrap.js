// backend/src/core/bootstrap.js
import dotenv from "dotenv";
import { Streamer } from "../models/Streamer.js";
import { Command } from "../models/Command.js";
import { Automation } from "../models/Automation.js";
import { setCommands, setAutomations } from "./registry.js"; // ✅ cleaned import

dotenv.config({ path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.local"});

/**
 * Bootstrap database caches and ensure at least one streamer exists
 */
export async function bootstrapCaches() {
  try {
    // 🧠 Try to find a real streamer with Twitch OAuth tokens
    let activeStreamer = await Streamer.findOne({ "twitchAuth.accessToken": { $exists: true } });

    // 🧩 If none found, fall back to a dev/test streamer
    if (!activeStreamer) {
      const ownerId = process.env.DEV_STREAMER_OWNER_ID || "dev-streamer";
      const displayName = process.env.DEV_STREAMER_DISPLAY || "Dev Streamer";

      activeStreamer = await Streamer.findOne({ ownerId });

      if (!activeStreamer) {
        activeStreamer = await Streamer.create({
          ownerId,
          displayName,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        console.log(`✅ Dev streamer '${displayName}' created.`);
      } else {
        console.log(`✅ Dev streamer '${displayName}' already exists.`);
      }
    } else {
      console.log(`✅ Using real streamer '${activeStreamer.displayName}'`);
    }

    // 🧾 Load all streamers and cache their commands + automations
    const streamers = await Streamer.find({});
    for (const st of streamers) {
      const commands = await Command.find({ streamerId: st._id, enabled: true });
      const automations = await Automation.find({ streamerId: st._id, enabled: true });

      // ✅ Store in memory for fast access
      setCommands(st._id, commands || []);
      setAutomations(st._id, automations || []);
    }

    console.log(`📚 Cache primed for ${streamers.length} streamer(s) with Twitch + automations.`);
  } catch (err) {
    console.error("❌ Bootstrap error:", err);
  }
}
