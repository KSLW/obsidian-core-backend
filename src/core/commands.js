import { Command } from "../models/Command.js";
import { sanitizeText } from "./utils.js";

export async function executeCommand(streamerId, name, displayName, tmiClient, target) {
  const cmd = await Command.findOne({ streamerId, name, enabled: true });
  if (!cmd) return false;

  const response = sanitizeText(
    cmd.response.replace("{username}", displayName || "")
  );
  await tmiClient.say(target, response);
  await Command.updateOne({ _id: cmd._id }, { $set: { lastUsed: new Date() } });
  return true;
}
