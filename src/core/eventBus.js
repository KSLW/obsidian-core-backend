// src/core/eventBus.js
import { WebSocketServer } from "ws";
import EventEmitter from "events";

let wss = null;
export const internalBus = new EventEmitter();

/** Start a broadcast WebSocket for dashboards and emit internal events */
export function createEventBus(port) {
  wss = new WebSocketServer({ port });
  console.log(`📡 WebSocket Event Bus active on port ${port}`);
}

/** Emit to both frontend and backend listeners */
export function emitEvent(streamerId, type, data = {}) {
  const payload = { streamerId, type, data, timestamp: Date.now() };

  // frontend dashboards
  if (wss) {
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(JSON.stringify(payload));
    }
  }

  // backend listeners
  internalBus.emit(type, { streamerId, ...data });
}

/** Frontend only */
export function broadcastEvent(streamerId, type, data = {}) {
  if (!wss) return;
  const payload = JSON.stringify({ streamerId, type, data, timestamp: Date.now() });
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(payload);
  }
}

/** Subscribe modules inside backend */
export function onEvent(type, handler) {
  internalBus.on(type, handler);
}
