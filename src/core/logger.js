// backend/src/core/logger.js
import fs from "fs";
import path from "path";
import dayjs from "dayjs";
import { fileURLToPath } from "url";
import { ModerationLog } from "../models/ModerationLog.js";
import { Log } from "../models/log.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "../data/logs");

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const memoryCache = [];
const CACHE_LIMIT = 2000; // recent events

const TWITCH_LOG = path.join(LOG_DIR, "twitch.log");
const MOD_LOG = path.join(LOG_DIR, "moderation.log");

function writeLine(category, data) {
  const date = dayjs().format("YYYY-MM-DD");
  const logFile = path.join(LOG_DIR, `${date}.log`);
  const entry = `[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] [${category.toUpperCase()}] ${data}\n`;
  fs.appendFileSync(logFile, entry);
  memoryCache.push(entry);
  if (memoryCache.length > CACHE_LIMIT) memoryCache.shift();
}

/* ─────────── Generic ─────────── */

export async function logEvent({
  platform = "system",
  type = "unknown",
  user,
  channel,
  message,
  meta = {},
}) {
  try {
    await Log.create({ platform, type, user, channel, message, meta });
    console.log(`📜 [${platform}] ${type} logged.`);
  } catch (err) {
    console.error("⚠️ Failed to save log:", err.message);
  }
}


function appendLine(file, line) {
  fs.appendFile(file, line + "\n", () => {});
}

export function logTwitchEvent(evt) {
  appendLine(TWITCH_LOG, JSON.stringify({ ts: Date.now(), ...evt }));
  console.log("📜 [Twitch]", evt.type, "logged.");
}

export async function logModerationEvent(streamerId, details) {
  appendLine(MOD_LOG, JSON.stringify({ ts: Date.now(), streamerId, ...details }));
  try {
    await ModerationLog.create({ streamerId, ...details });
  } catch {}
  console.log("🛡️ [Moderation] logged:", details.reason || details.action);
}


/* ─────────── Discord ─────────── */
export function logDiscordEvent(type, meta = {}) {
  const msg = `Discord ${type}`;
  logEvent("discord", msg, meta);
}

/* ─────────── OBS ─────────── */
export function logOBSEvent(type, meta = {}) {
  const msg = `OBS ${type}`;
  logEvent("obs", msg, meta);
}

/* ─────────── Automation ─────────── */
export function logAutomationEvent(trigger, meta = {}) {
  const msg = `Automation ${trigger}`;
  logEvent("automation", msg, meta);
}

/* ─────────── System ─────────── */
export function logSystem(message, meta = {}) {
  logEvent("system", message, meta);
}

/* ─────────── Access / Management ─────────── */
export async function getLogs({ platform, type, limit = 100, from, to }) {
  const filter = {};
  if (platform) filter.platform = platform;
  if (type) filter.type = type;
  if (from || to) filter.createdAt = {};
  if (from) filter.createdAt.$gte = new Date(from);
  if (to) filter.createdAt.$lte = new Date(to);

  return Log.find(filter).sort({ createdAt: -1 }).limit(limit);
}


export async function clearLogs(platform) {
  const filter = platform ? { platform } : {};
  await Log.deleteMany(filter);
  return { success: true };
}

export async function logSystemEvent(type, meta = {}) {
  try {
    console.log(`📜 [System] ${type} logged.`);
    await Log.create({
      platform: "system",
      type,
      user: "system",
      message: meta.message || "Automatic system action",
      meta,
      timestamp: new Date(),
    });
  } catch (err) {
    console.warn("⚠️ Failed to record system event:", err.message);
  }
}
