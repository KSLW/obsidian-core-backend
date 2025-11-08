// src/core/moderation.js

// Safety presets (extend later)
export const SAFETY = {
  LOW: [
    { pattern: /(kill yourself)/i, action: "timeout", duration: 600, reason: "self-harm encouragement" },
  ],
  MEDIUM: [
    { pattern: /(kill yourself)/i, action: "timeout", duration: 900, reason: "self-harm encouragement" },
    { pattern: /(slur1|slur2)/i, action: "timeout", duration: 900, reason: "hate speech" },
  ],
  HIGH: [
    { pattern: /(kill yourself)/i, action: "ban", reason: "self-harm encouragement" },
    { pattern: /(slur1|slur2)/i, action: "ban", reason: "hate speech" },
  ],
};

// simple in-memory moderation settings per streamer
const settings = new Map(); // streamerId -> { level, customBanned[] }

export function getModerationSettings(streamerId = "global") {
  if (!settings.has(streamerId)) {
    settings.set(streamerId, { level: "MEDIUM", customBanned: [] });
  }
  return settings.get(streamerId);
}

export function setModerationLevel(streamerId, level = "MEDIUM") {
  const s = getModerationSettings(streamerId);
  s.level = level;
  settings.set(streamerId, s);
  return s;
}

export function setCustomBanned(streamerId, words = []) {
  const s = getModerationSettings(streamerId);
  s.customBanned = words;
  settings.set(streamerId, s);
  return s;
}

export async function checkMessageSafety(streamerId, message) {
  const s = getModerationSettings(streamerId);
  const rules = [...SAFETY[s.level], ...s.customBanned.map((w) => ({
    pattern: new RegExp(`\\b${escapeRegExp(w)}\\b`, "i"),
    action: "timeout",
    duration: 300,
    reason: "custom banned",
  }))];

  for (const rule of rules) {
    if (rule.pattern.test(message)) return rule;
  }
  return null;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
