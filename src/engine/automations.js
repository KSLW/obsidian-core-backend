import { onEvent } from "../core/eventBus.js";
import { Registry } from "../core/registry.js";
import { runAction } from "./actions.js";

// Subscribe once, route everything into runAutomations
onEvent("twitch.redemption", ({ streamerId, redemption }) => {
  runAutomations(streamerId, "twitch.redemption", { redemption }).catch(console.error);
});
onEvent("twitch.chat", ({ streamerId, message, user }) => {
  runAutomations(streamerId, "twitch.chat", { message, user }).catch(console.error);
});
onEvent("timer.tick", ({ streamerId, timerId, name }) => {
  runAutomations(streamerId, "timer.tick", { timerId, name }).catch(console.error);
});

export async function runAutomations(streamerId, type, payload) {
  const rules = Registry.automations.get(streamerId) || [];
  for (const rule of rules) {
    if (!rule.enabled) continue;
    // very basic matching model
    if (rule.trigger?.type !== type) continue;

    // (optional) simple match check
    if (rule.trigger?.match) {
      const ok = Object.entries(rule.trigger.match).every(([k, v]) => String(payload?.[k]) === String(v));
      if (!ok) continue;
    }

    // run actions sequentially
    for (const action of (rule.actions || [])) {
      try { await runAction(streamerId, action.type, action.params || {}, payload); }
      catch (e) { console.error("Automation action failed:", e.message); }
    }
  }
}
