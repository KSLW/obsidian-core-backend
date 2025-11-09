// src/core/logger.js
import mongoose from "mongoose";
import { Log } from "../models/Log.js";

/**
 * Normalizes the subtype field:
 * Accepts either a string or an object, but stores an object-friendly string version.
 */
function normalizeSubtype(value) {
  if (!value) return "unknown";
  if (typeof value === "string") return value;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/* ─────────────────────────────────────────────
   🧩 Generic System Log
─────────────────────────────────────────────── */
export async function logSystemEvent(subtype, data = {}) {
  try {
    const log = new Log({
      type: "system",
      subtype: normalizeSubtype(subtype),
      meta: data,
    });
    await log.save();
    console.log(`📜 [System] ${subtype} logged.`);
  } catch (err) {
    console.warn("⚠️ Failed to save system log:", err.message);
  }
}

/* ─────────────────────────────────────────────
   🎥 Twitch Events
─────────────────────────────────────────────── */
export async function logTwitchEvent(subtype, data = {}, streamerId = "global") {
  try {
    const log = new Log({
      type: "twitch",
      subtype: normalizeSubtype(subtype),
      streamerId,
      meta: data,
    });
    await log.save();
  } catch (err) {
    console.warn("⚠️ Failed to save twitch log:", err.message);
  }
}

/* ─────────────────────────────────────────────
   🛡️ Moderation Events
─────────────────────────────────────────────── */
export async function logModerationEvent(streamerId, details = {}) {
  try {
    const log = new Log({
      type: "moderation",
      subtype: normalizeSubtype(details.action || "unknown"),
      streamerId,
      meta: details,
    });
    await log.save();
  } catch (err) {
    console.warn("⚠️ Failed to save moderation log:", err.message);
  }
}

/* ─────────────────────────────────────────────
   ⚙️ Automation Logs
─────────────────────────────────────────────── */
export async function logAutomationEvent(streamerId, trigger, result = {}) {
  try {
    const log = new Log({
      type: "automation",
      subtype: normalizeSubtype(trigger?.type || "unknown"),
      streamerId,
      meta: { trigger, result },
    });
    await log.save();
  } catch (err) {
    console.warn("⚠️ Failed to save automation log:", err.message);
  }
}
