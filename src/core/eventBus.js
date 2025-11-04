import { WebSocketServer } from "ws";
import EventEmitter from "events";

// Internal event bus (automation consumes this)
export const internalBus = new EventEmitter();
let wss = null;

export function createEventBus(port) {
  wss = new WebSocketServer({ port });
  console.log(`📡 WebSocket Event Bus active on port ${port}`);
}

export function emitEvent(streamerId, type, data = {}) {
  // Broadcast to dashboards
  if (wss) {
    const payload = JSON.stringify({ streamerId, type, data, timestamp: Date.now() });
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(payload);
    }
  }
  // Notify automation listeners
  internalBus.emit(type, { streamerId, ...data });
}

export function broadcastEvent(streamerId, type, data = {}) {
  if (!wss) return;
  const payload = JSON.stringify({ streamerId, type, data, timestamp: Date.now() });
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(payload);
  }
}

export function onEvent(type, handler) {
  internalBus.on(type, handler);
}
