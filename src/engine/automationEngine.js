// src/core/automationEngine.js
import { Automation } from "../models/Automation.js";
import { onEvent } from "../core/eventBus.js";
import { runActions } from "../core/actions.js";
import { logAutomationEvent } from "../core/logger.js";

/**
 * In-memory cooldown tracker: Map(automationId -> lastRunMs)
 */
const cooldownMap = new Map();

/**
 * Evaluate whether an automation should run for a given event payload.
 */
function shouldRun(automation, payload) {
  // cooldown check
  const cd = automation.conditions?.cooldownSec || 0;
  if (cd > 0) {
    const last = cooldownMap.get(automation._id?.toString());
    if (last && Date.now() - last < cd * 1000) return false;
  }

  // Specific matching
  const { triggerType, triggerName, conditions } = automation;
  const { textIncludes = [], userIsMod = false } = conditions || {};
  const isMod = Boolean(payload?.user?.isMod || payload?.isMod);

  if (userIsMod && !isMod) return false;

  switch (triggerType) {
    case "twitch.chat.command": {
      const incoming = (payload?.command || "").toLowerCase();
      return triggerName && incoming === triggerName.toLowerCase();
    }
    case "twitch.redemption": {
      const incoming = (payload?.reward || "").toLowerCase();
      return triggerName && incoming === triggerName.toLowerCase();
    }
    case "twitch.chat.message": {
      const msg = (payload?.message || "").toLowerCase();
      if (triggerName && !msg.includes(triggerName.toLowerCase())) return false;
      if (textIncludes?.length) {
        return textIncludes.every((frag) => msg.includes(String(frag).toLowerCase()));
      }
      return true;
    }
    default:
      return false;
  }
}

/**
 * Run all automations that match an event.
 * @param {string} streamerId
 * @param {string} triggerType e.g. "twitch.chat.command"
 * @param {object} payload event payload
 */
export async function runAutomations(streamerId, triggerType, payload = {}) {
  const list = await Automation.find({ streamerId, enabled: true, triggerType }).lean();
  if (!list?.length) return;

  for (const auto of list) {
    try {
      if (!shouldRun(auto, payload)) continue;

      // Set cooldown stamp
      const id = auto._id?.toString();
      const cd = auto.conditions?.cooldownSec || 0;
      if (cd > 0 && id) cooldownMap.set(id, Date.now());

      const vars = {
        username: payload?.user?.name || payload?.user || "",
        message: payload?.message || "",
        reward: payload?.reward || "",
        command: payload?.command || "",
      };

      await logAutomationEvent(streamerId, {
        automationId: id,
        triggerType,
        triggerName: auto.triggerName || null,
        payload,
        status: "running",
      });

      await runActions(streamerId, auto.actions, { vars, rawEvent: payload });

      await logAutomationEvent(streamerId, {
        automationId: id,
        triggerType,
        triggerName: auto.triggerName || null,
        payload,
        status: "completed",
      });
    } catch (e) {
      console.error("Automation failed:", auto._id?.toString(), e.message);
      await logAutomationEvent(streamerId, {
        automationId: auto._id?.toString(),
        triggerType,
        triggerName: auto.triggerName || null,
        payload,
        status: "error",
        error: e.message,
      });
    }
  }
}

/**
 * Wire engine to internal event bus.
 * Your Twitch code should already be emitting:
 *  - emitEvent(streamerId, "twitch.chat.command", { user, command })
 *  - emitEvent(streamerId, "twitch.redemption", { user, reward })
 *  - emitEvent(streamerId, "twitch.chat.message", { user, message })
 */
export function attachAutomationListeners() {
  onEvent("twitch.chat.command", async (streamerId, data) =>
    runAutomations(streamerId, "twitch.chat.command", data)
  );
  onEvent("twitch.redemption", async (streamerId, data) =>
    runAutomations(streamerId, "twitch.redemption", data)
  );
  onEvent("twitch.chat.message", async (streamerId, data) =>
    runAutomations(streamerId, "twitch.chat.message", data)
  );
}
