import { Automation } from "../models/Automation.js";
import { emitEvent } from "./eventBus.js";

let activeTimers = [];

export async function loadTimers() {
  const timers = await Automation.find({ "trigger.type": "timer", enabled: true });
  for (const t of timers) {
    const interval = Math.max(5, Number(t.trigger?.interval || 60)); // seconds
    const id = setInterval(() => {
      emitEvent(t.streamerId || "global", "timer.tick", { timerId: t._id, name: t.name });
    }, interval * 1000);
    activeTimers.push({ id, timer: t });
  }
  console.log(`⏱️ Loaded ${activeTimers.length} timers`);
}

export function clearTimers() {
  for (const t of activeTimers) clearInterval(t.id);
  activeTimers = [];
}
