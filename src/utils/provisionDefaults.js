import { Command } from "../models/Command.js";
import { Automation } from "../models/Automation.js";

export async function provisionDefaultsForStreamer(streamerId) {
  console.log(`🧩 Provisioning defaults for streamer: ${streamerId}`);
  // you can customize per-streamer seeds here; as a baseline,
  // if they have no commands/automations, copy "global" defaults
  const [haveCmds, haveAutos] = await Promise.all([
    Command.countDocuments({ streamerId }),
    Automation.countDocuments({ streamerId }),
  ]);
  if (haveCmds === 0) {
    const globalCmds = await Command.find({ streamerId: "global" });
    if (globalCmds.length) {
      await Command.insertMany(globalCmds.map(c => ({ ...c.toObject(), _id: undefined, streamerId })));
    }
  }
  if (haveAutos === 0) {
    const globalAutos = await Automation.find({ streamerId: "global" });
    if (globalAutos.length) {
      await Automation.insertMany(globalAutos.map(a => ({ ...a.toObject(), _id: undefined, streamerId })));
    }
  }
  console.log(`✅ Provisioned defaults for streamer ${streamerId}`);
}
