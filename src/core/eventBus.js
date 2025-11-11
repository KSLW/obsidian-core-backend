import { WebSocketServer } from "ws";
import { EventEmitter } from "events";

const internal = new EventEmitter();
let wss = null;

export function createEventBus(port) {
  wss = new WebSocketServer({ port });
  console.log(`📡 WebSocket Event Bus active on port ${port}`);
}

export function emitEvent(streamerId, type, data = {}) {
  const payload = { streamerId, type, data, timestamp: Date.now() };
  // outward to dashboards
  if (wss) {
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(JSON.stringify(payload));
    }
  }
  // inward to engine
  internal.emit(type, data);
}

export function subscribeEvent(type, handler) {
  internal.on(type, handler);
}
