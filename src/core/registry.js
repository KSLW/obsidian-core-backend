// In-memory registry
export const Registry = {
  commands: new Map(),        // streamerId -> [{name, response, cooldown...}]
  automations: new Map(),     // streamerId -> [...]
  timers: new Map(),          // streamerId -> setInterval handles
  twitchCommands: new Map(),  // streamerId -> [{name, response, ...}]
};

/* Generic commands (legacy) */
export function setCommands(streamerId, list) { Registry.commands.set(streamerId, list || []); }
export function addCommand(streamerId, cmd) {
  const list = Registry.commands.get(streamerId) || [];
  list.push(cmd); Registry.commands.set(streamerId, list); return cmd;
}
export function removeCommand(streamerId, id) {
  const list = Registry.commands.get(streamerId) || [];
  const filtered = list.filter(c => c._id !== id && c.id !== id);
  Registry.commands.set(streamerId, filtered); return filtered;
}

/* Automations */
export function setAutomations(streamerId, list) { Registry.automations.set(streamerId, list || []); }
export function addAutomation(streamerId, a) {
  const list = Registry.automations.get(streamerId) || [];
  list.push(a); Registry.automations.set(streamerId, list); return a;
}
export function removeAutomation(streamerId, id) {
  const list = Registry.automations.get(streamerId) || [];
  const filtered = list.filter(x => x._id !== id && x.id !== id);
  Registry.automations.set(streamerId, filtered); return filtered;
}

/* Twitch-specific commands */
export function setTwitchCommands(streamerId, list) { Registry.twitchCommands.set(streamerId, list || []); }
export function addTwitchCommand(streamerId, cmd) {
  const list = Registry.twitchCommands.get(streamerId) || [];
  list.push(cmd); Registry.twitchCommands.set(streamerId, list); return cmd;
}
export function removeTwitchCommand(streamerId, id) {
  const list = Registry.twitchCommands.get(streamerId) || [];
  const filtered = list.filter(c => c._id !== id && c.id !== id);
  Registry.twitchCommands.set(streamerId, filtered); return filtered;
}
export function getTwitchCommand(streamerId, name) {
  const list = Registry.twitchCommands.get(streamerId) || [];
  return list.find(c => c.name?.toLowerCase() === name?.toLowerCase());
}
export function clearAllRegistry() {
  Registry.commands.clear();
  Registry.automations.clear();
  Registry.timers.clear();
  Registry.twitchCommands.clear();
}
