// /src/core/eventBus.js
import { WebSocketServer } from "ws";
import EventEmitter from "events";

let wss = null;
const internalBus = new EventEmitter();

export function createEventBus(port) {
  wss = new WebSocketServer({ port });
  console.log(`📡 WebSocket Event Bus active on port ${port}`);
}

export function onEvent(type, handler) {
  internalBus.on(type, handler);
}

/** Emits to frontends + internal bus */
export function emitEvent(streamerId, type, data = {}) {
  if (wss) {
    const payload = { streamerId, type, data, timestamp: Date.now() };
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(JSON.stringify(payload));
    }
  }
  // internal: deliver both streamerId and data
  internalBus.emit(type, streamerId, data);
}
