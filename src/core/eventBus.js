// src/core/eventBus.js
import { WebSocketServer } from "ws";

/**
 * Global WebSocket event bus + internal listener registry
 * Supports wildcard events (e.g. "twitch.*" or "*.connected")
 */
let wss = null;
const listeners = new Map(); // eventName => Set<callback>

/* ───────────────────────────────
   🛰️  Create WebSocket Event Bus
──────────────────────────────── */
export function createEventBus(port = 3002) {
  if (wss) return wss; // avoid duplicate creation

  wss = new WebSocketServer({ port });
  console.log(`📡 WebSocket Event Bus active on port ${port}`);

  wss.on("connection", (ws) => {
    ws.send(JSON.stringify({ type: "connected", message: "EventBus ready" }));
  });

  return wss;
}

/* ───────────────────────────────
   🎧  Subscribe to event(s)
──────────────────────────────── */
/**
 * @param {string} eventName - Exact or wildcard (e.g. "twitch.chat.*" or "*.connected")
 * @param {Function} callback - (payload, streamerId, eventName) => {}
 * @returns {Function} unsubscribe
 */
export function subscribeEvent(eventName, callback) {
  if (!listeners.has(eventName)) {
    listeners.set(eventName, new Set());
  }
  listeners.get(eventName).add(callback);

  return () => listeners.get(eventName)?.delete(callback);
}

/* ───────────────────────────────
   📤  Emit Event
──────────────────────────────── */
export async function emitEvent(streamerId = "global", eventName, payload = {}) {
  const eventObj = {
    timestamp: new Date().toISOString(),
    streamerId,
    type: eventName,
    payload,
  };

  // 1️⃣ Execute matching listeners (including wildcards)
  const allListeners = [...listeners.entries()];
  for (const [key, fns] of allListeners) {
    if (matchesEvent(key, eventName)) {
      for (const fn of fns) {
        try {
          await Promise.resolve(fn(payload, streamerId, eventName));
        } catch (err) {
          console.error(`⚠️ Event listener error (${key}):`, err.message);
        }
      }
    }
  }

  // 2️⃣ WebSocket broadcast to dashboards
  if (wss) {
    const msg = JSON.stringify({ type: "event", event: eventObj });
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(msg);
    }
  }

  console.log(`[EventBus] ${eventName} (${streamerId})`);
}

/* ───────────────────────────────
   🔍  Helper: Wildcard Matching
──────────────────────────────── */
function matchesEvent(pattern, actual) {
  if (pattern === actual) return true;
  const regex = new RegExp("^" + pattern.split("*").map(escapeRegex).join(".*") + "$");
  return regex.test(actual);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
