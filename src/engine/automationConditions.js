const cooldownMap = new Map(); // automationId -> lastTriggeredMs

export async function checkAutomationConditions(auto, payload) {
  // basic contains filter
  if (auto.conditions?.textIncludes?.length && payload?.message) {
    const ok = auto.conditions.textIncludes.some((t) =>
      payload.message.toLowerCase().includes(String(t).toLowerCase())
    );
    if (!ok) return false;
  }

  // cooldown
  const cd = Number(auto.conditions?.cooldownSec || 0);
  if (cd > 0) {
    const last = cooldownMap.get(String(auto._id)) || 0;
    const now = Date.now();
    if (now - last < cd * 1000) return false;
  }

  return true;
}

export function markAutomationTriggered(auto) {
  cooldownMap.set(String(auto._id), Date.now());
}
