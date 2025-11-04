// backend/src/core/registry.js
import { EventEmitter } from "events";

// In-memory registry for commands, automations, timers, etc.
export const Registry = {
  commands: new Map(),
  automations: new Map(),
  timers: new Map(),
  twitchCommands: new Map(),
};

// Global event bus for backend modules
export const registryBus = new EventEmitter();

/* ────────────────────────────────
   🧩 Twitch Commands
──────────────────────────────── */
export function setTwitchCommands(streamerId, commands) {
  Registry.twitchCommands.set(streamerId, commands);
  registryBus.emit("twitchCommandsUpdated", { streamerId, commands });
}

export function addTwitchCommand(streamerId, command) {
  const list = Registry.twitchCommands.get(streamerId) || [];
  list.push(command);
  Registry.twitchCommands.set(streamerId, list);
  registryBus.emit("twitchCommandAdded", { streamerId, command });
  return command;
}

export function removeTwitchCommand(streamerId, commandId) {
  const list = Registry.twitchCommands.get(streamerId) || [];
  const filtered = list.filter((c) => c.id !== commandId);
  Registry.twitchCommands.set(streamerId, filtered);
  registryBus.emit("twitchCommandRemoved", { streamerId, commandId });
  return filtered;
}

// ✅ Plural getter
export function getTwitchCommands(streamerId) {
  return Registry.twitchCommands.get(streamerId) || [];
}

// ✅ Singular alias (fixes your current error)
export function getTwitchCommand(streamerId, commandId) {
  const list = Registry.twitchCommands.get(streamerId) || [];
  return list.find((c) => c.id === commandId) || null;
}

/* ────────────────────────────────
   ⚙️ Generic Commands
──────────────────────────────── */
export function setCommands(streamerId, commands) {
  Registry.commands.set(streamerId, commands);
  registryBus.emit("commandsUpdated", { streamerId, commands });
}

export function addCommand(streamerId, command) {
  const list = Registry.commands.get(streamerId) || [];
  list.push(command);
  Registry.commands.set(streamerId, list);
  registryBus.emit("commandAdded", { streamerId, command });
  return command;
}

export function removeCommand(streamerId, commandId) {
  const list = Registry.commands.get(streamerId) || [];
  const filtered = list.filter((cmd) => cmd.id !== commandId);
  Registry.commands.set(streamerId, filtered);
  registryBus.emit("commandRemoved", { streamerId, commandId });
  return filtered;
}

export function getCommands(streamerId) {
  return Registry.commands.get(streamerId) || [];
}

/* ────────────────────────────────
   ⚡ Automations
──────────────────────────────── */
export function setAutomations(streamerId, automations) {
  Registry.automations.set(streamerId, automations);
  registryBus.emit("automationsUpdated", { streamerId, automations });
}

export function addAutomation(streamerId, automation) {
  const list = Registry.automations.get(streamerId) || [];
  list.push(automation);
  Registry.automations.set(streamerId, list);
  registryBus.emit("automationAdded", { streamerId, automation });
  return automation;
}

export function removeAutomation(streamerId, automationId) {
  const list = Registry.automations.get(streamerId) || [];
  const filtered = list.filter((a) => a.id !== automationId);
  Registry.automations.set(streamerId, filtered);
  registryBus.emit("automationRemoved", { streamerId, automationId });
  return filtered;
}

export function getAutomations(streamerId) {
  return Registry.automations.get(streamerId) || [];
}

/* ────────────────────────────────
   🕒 Timers
──────────────────────────────── */
export function setTimers(streamerId, timers) {
  Registry.timers.set(streamerId, timers);
  registryBus.emit("timersUpdated", { streamerId, timers });
}

export function getTimers(streamerId) {
  return Registry.timers.get(streamerId) || [];
}

/* ────────────────────────────────
   🧹 Utilities
──────────────────────────────── */
export function clearAllRegistry() {
  Registry.commands.clear();
  Registry.automations.clear();
  Registry.timers.clear();
  Registry.twitchCommands.clear();
  registryBus.emit("registryCleared");
}

export function debugRegistry() {
  console.log("🧠 Current Registry State:", {
    commands: Registry.commands.size,
    automations: Registry.automations.size,
    timers: Registry.timers.size,
    twitchCommands: Registry.twitchCommands.size,
  });
}

/* ────────────────────────────────
   🔁 Upsert Command
──────────────────────────────── */
export function upsertCommand(streamerId, newCommand) {
  const list = Registry.commands.get(streamerId) || [];

  // Check for an existing command by ID or trigger name
  const existingIndex = list.findIndex(
    (cmd) =>
      cmd.id === newCommand.id ||
      (cmd.name && newCommand.name && cmd.name.toLowerCase() === newCommand.name.toLowerCase())
  );

  if (existingIndex >= 0) {
    // Update existing command
    list[existingIndex] = { ...list[existingIndex], ...newCommand, updatedAt: Date.now() };
    console.log(`🔄 Updated command "${newCommand.name}" for ${streamerId}`);
  } else {
    // Insert new command
    list.push({ ...newCommand, createdAt: Date.now(), updatedAt: Date.now() });
    console.log(`✨ Added new command "${newCommand.name}" for ${streamerId}`);
  }

  Registry.commands.set(streamerId, list);
  return list;
}

export function upsertTwitchCommand(streamerId, newCommand) {
  const list = Registry.twitchCommands.get(streamerId) || [];
  const existingIndex = list.findIndex(
    (cmd) =>
      cmd.id === newCommand.id ||
      (cmd.name && newCommand.name && cmd.name.toLowerCase() === newCommand.name.toLowerCase())
  );

  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...newCommand, updatedAt: Date.now() };
    console.log(`🔁 Updated Twitch command "${newCommand.name}" for ${streamerId}`);
  } else {
    list.push({ ...newCommand, createdAt: Date.now(), updatedAt: Date.now() });
    console.log(`🟣 Added Twitch command "${newCommand.name}" for ${streamerId}`);
  }

  Registry.twitchCommands.set(streamerId, list);
  return list;
}
