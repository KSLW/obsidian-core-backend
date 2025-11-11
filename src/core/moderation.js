import { ModerationLog } from "../models/ModerationLog.js";

const PRESET = {
  LOW: [/kill yourself/i],
  MEDIUM: [/go back to/i],
  HIGH: [/slur1|slur2/i], // replace with your actual patterns
};

export async function checkMessageSafety(streamerId, text = "") {
  // later: load per-streamer safety settings & custom banned words from DB
  // for now we use MEDIUM as default
  const rules = [...PRESET.LOW, ...PRESET.MEDIUM, ...PRESET.HIGH];
  for (const pattern of rules) {
    if (pattern.test(text)) {
      return {
        action: "timeout",
        reason: "auto_mod",
        duration: 600,
        pattern,
      };
    }
  }
  return null;
}
