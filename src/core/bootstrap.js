import { Streamer } from "../models/Streamer.js";
import { Command } from "../models/Command.js";
import { Automation } from "../models/Automation.js";
import { setCommands, setAutomations, setTwitchCommands } from "./registry.js";

export async function bootstrapCaches() {
  // Prefer real OAuth’d streamer; fallback to DEV if configured
  let real = await Streamer.findOne({ "twitchAuth.accessToken": { $exists: true } });
  if (real) {
    console.log(`✅ Using real streamer '${real.displayName}'`);
  } else if (process.env.DEV_STREAMER_OWNER_ID) {
    const ownerId = process.env.DEV_STREAMER_OWNER_ID;
    const s = await Streamer.findOne({ ownerId }) || await Streamer.create({
      ownerId,
      displayName: process.env.DEV_STREAMER_DISPLAY || "Dev Streamer",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    console.log(`✅ Dev streamer '${s.displayName}' ready`);
  }

  const all = await Streamer.find({});
  for (const s of all) {
    const cmds = await Command.find({ streamerId: s._id, enabled: true });
    const autos = await Automation.find({ streamerId: s._id, enabled: true });
    setCommands(s._id, cmds);
    setTwitchCommands(s._id, cmds.filter(c => (c.platforms || []).includes("twitch")));
    setAutomations(s._id, autos);
  }

  console.log(`📚 Cache primed for ${all.length} streamer(s).`);
}
