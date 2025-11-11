// Minimal in-memory registry (optional).
// Most command execution goes via DB (Command model).
const twitchCommandsCache = new Map(); // streamerId -> Map<name, response>

export function registerCommand(streamerId, name, response) {
  const bucket = twitchCommandsCache.get(streamerId) || new Map();
  bucket.set(name.toLowerCase(), response);
  twitchCommandsCache.set(streamerId, bucket);
}

export function getTwitchCommand(streamerId, name) {
  const bucket = twitchCommandsCache.get(streamerId);
  if (!bucket) return null;
  const resp = bucket.get(name.toLowerCase());
  return resp ? { response: resp } : null;
}

export function clearRegistry() {
  twitchCommandsCache.clear();
}
