// backend/src/engine/automations.js
/**
 * Automation engine:
 * - Listens to event bus (twitch.message, obs.sceneChanged, timer.tick, etc.)
 * - Matches rules from Registry
 * - Runs their actions in order
 */

import { Registry } from "../core/registry.js";
import { runActions } from "./actions.js";
import { internalBus, onEvent } from "../core/eventBus.js";

/**
 * Event payload shape routed to the engine:
 * {
 *   streamerId,
 *   platform,
 *   event: { source, type, payload }
 *   // + ambient context (guild, member, sayTwitch/Discord, etc.)
 * }
 */
export async function handleEvent(ctx) {
  const streamerId = String(ctx.streamerId);
  const rules = Registry.automations.get(streamerId) || [];

  for (const rule of rules) {
    if (rule.enabled === false) continue;

    // trigger match
    if (!triggerMatches(rule.trigger, ctx.event)) continue;

    // optional conditions
    if (!conditionsMatch(rule.conditions || [], ctx)) continue;

    await runActions(ctx, rule.actions || []);
  }
}

function triggerMatches(trigger = {}, evt = {}) {
  if (!trigger || !evt) return false;
  if (trigger.source && trigger.source !== evt.source) return false;
  if (trigger.type && trigger.type !== evt.type) return false;

  // rudimentary key/value match against evt.payload
  if (trigger.match && typeof trigger.match === "object") {
    return Object.entries(trigger.match).every(([k, v]) => {
      // strict equals; can extend with regex later
      return String(evt.payload?.[k]) === String(v);
    });
  }
  return true;
}

function conditionsMatch(conds = [], ctx = {}) {
  for (const c of conds) {
    const left = get(ctx, c.field);
    switch (c.op) {
      case "eq": if (!(left === c.value)) return false; break;
      case "neq": if (!(left !== c.value)) return false; break;
      case "gt": if (!(Number(left) > Number(c.value))) return false; break;
      case "lt": if (!(Number(left) < Number(c.value))) return false; break;
      case "includes":
        if (!Array.isArray(left) || !left.includes(c.value)) return false;
        break;
      default: break;
    }
  }
  return true;
}

function get(obj, path = "") {
  return String(path).split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
}

/** Wire up the internal bus so modules can just emit events by name */
export function initAutomationBus() {
  // anything like: internalBus.emit("twitch.message", { streamerId, ... })
  internalBus.on("twitch.message", async (ctx) => {
    try { await handleEvent(ctx); } catch (e) { console.error("Automation error:", e); }
  });

  internalBus.on("obs.sceneChanged", async (ctx) => {
    try { await handleEvent(ctx); } catch (e) { console.error("Automation error:", e); }
  });

  internalBus.on("timer.tick", async (ctx) => {
    try { await handleEvent(ctx); } catch (e) { console.error("Automation error:", e); }
  });

  // add more wires as needed (redemptions, follows, etc.)
}

// ───────── Automation Management ─────────
export function addAutomation(streamerId, automation) {
  const list = Registry.automations.get(streamerId) || [];
  list.push(automation);
  Registry.automations.set(streamerId, list);
  return automation;
}

export function removeAutomation(streamerId, automationId) {
  const list = Registry.automations.get(streamerId) || [];
  const filtered = list.filter((a) => a.id !== automationId);
  Registry.automations.set(streamerId, filtered);
  return filtered;
}

onEvent("twitchRedemption", async (payload) => {
  console.log(`💎 Redemption by ${payload.user_name}: ${payload.reward.title}`);
  // Example: trigger OBS or Discord reactions here
});
