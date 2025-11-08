// src/core/registry.js

// minimal command registry to start
const twitchCommands = new Map(); // streamerId -> [{ name, response }]
// seed a default hydrate & hello
twitchCommands.set("global", [
  { name: "hello", response: "Hey {username}! 👋" },
  { name: "hydrate", response: "💧 Stay hydrated, {username}!" },
]);

export function setTwitchCommands(streamerId, commands) {
  twitchCommands.set(streamerId, commands);
}

export function getTwitchCommand(streamerId, name) {
  const list = twitchCommands.get(streamerId) || twitchCommands.get("global") || [];
  return list.find((c) => c.name.toLowerCase() === name.toLowerCase());
}
