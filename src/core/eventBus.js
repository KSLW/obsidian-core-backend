// backend/src/core/eventBus.js
import { WebSocketServer } from "ws";
import EventEmitter from "events";

export const internalBus = new EventEmitter();
let wss = null;

/**
 * Create WebSocket + internal bus
 */
export function createEventBus(port) {
  wss = new WebSocketServer({ port });
  console.log(`📡 WebSocket Event Bus active on port ${port}`);
}

/**
 * Emit event globally (to both frontend and automation engine)
 */
export function emitEvent(streamerId, type, data = {}) {
  const payload = {
    streamerId,
    type,
    data,
    timestamp: Date.now(),
  };

  // Broadcast to all connected frontends
  if (wss) {
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(JSON.stringify(payload));
    }
  }

  // Pass internally (used by automations and handlers)
  internalBus.emit(type, payload);
}

/**
 * Subscribe backend systems to events
 */
export function onEvent(type, handler) {
  internalBus.on(type, handler);
}

/**
 * Broadcast event ONLY to frontends
 */
export function broadcastEvent(streamerId, type, data = {}) {
  if (!wss) return;
  const payload = JSON.stringify({
    streamerId,
    type,
    data,
    timestamp: Date.now(),
  });
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(payload);
  }
}
