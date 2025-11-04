import { Automation } from "../models/Automation.js";
import { emitEvent } from "./eventBus.js";

let active = [];

export async function loadTimers() {
  active.forEach(clearInterval);
  active = [];

  const timers = await Automation.find({ "trigger.type": "timer", enabled: true });
  for (const t of timers) {
    const every = Number(t.trigger?.interval || 60);
    const id = setInterval(() => {
      emitEvent(t.streamerId || "global", "timer.tick", { timerId: t._id, name: t.name });
    }, every * 1000);
    active.push(id);
  }
  console.log(`⏱️ Loaded ${active.length} timers`);
}

export function clearTimers() {
  active.forEach(clearInterval);
  active = [];
}
