// /src/engine/automations.js
import { Automation } from "../models/Automation.js";
import { onEvent } from "../core/eventBus.js";
import { logAutomationEvent } from "../core/logger.js";

// ACTION IMPLEMENTATIONS
import { sendTwitchMessage } from "../modules/twitch/index.js";

/**
 * Execute a single action safely with logging.
 */
async function execAction(streamerId, action, context = {}) {
  const { type, payload = {} } = action || {};
  try {
    switch (type) {
      case "sendTwitchMessage": {
        // payload: { text: "Hello {username}!" , channel?: "#channel" }
        const text = interpolate(payload.text || "", context);
        await sendTwitchMessage(text, payload.channel);
        await logAutomationEvent(streamerId, {
          type: "action",
          actionType: type,
          payload: { text },
          ok: true,
        });
        break;
      }

      case "obsSceneSwitch": {
        // payload: { scene: "BRB" }
        const scene = interpolate(payload.scene || "", context);
        await obsSceneSwitch(scene);
        await logAutomationEvent(streamerId, {
          type: "action",
          actionType: type,
          payload: { scene },
          ok: true,
        });
        break;
      }

      case "delay": {
        // payload: { ms: 1500 }
        const ms = Number(payload.ms || 0);
        await new Promise((r) => setTimeout(r, ms));
        await logAutomationEvent(streamerId, {
          type: "action",
          actionType: type,
          payload: { ms },
          ok: true,
        });
        break;
      }

      default:
        await logAutomationEvent(streamerId, {
          type: "action",
          actionType: type,
          payload,
          ok: false,
          error: "Unknown action type",
        });
        break;
    }
  } catch (err) {
    await logAutomationEvent(streamerId, {
      type: "action",
      actionType: type,
      payload,
      ok: false,
      error: err?.message || String(err),
    });
  }
}

/**
 * Replace tokens like {username} using context.
 */
function interpolate(template, ctx = {}) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, k) => {
    const v = ctx[k];
    return v === undefined || v === null ? `{${k}}` : String(v);
  });
}

/**
 * Run all automations matching a trigger.
 * @param {String} streamerId
 * @param {String} triggerType
 * @param {Object} eventData - raw event data (e.g., { user, command, reward, message })
 */
export async function runAutomations(streamerId, triggerType, eventData = {}) {
  const triggerName =
    eventData.command || eventData.reward || eventData.triggerName || "";

  // Fetch enabled automations for this trigger & name
  const autos = await Automation.find({
    streamerId,
    triggerType,
    triggerName: triggerName.toLowerCase(),
    enabled: true,
  }).sort({ createdAt: 1 });

  if (!autos.length) {
    await logAutomationEvent(streamerId, {
      type: "match",
      triggerType,
      triggerName,
      found: 0,
      meta: eventData,
    });
    return;
  }

  await logAutomationEvent(streamerId, {
    type: "match",
    triggerType,
    triggerName,
    found: autos.length,
    meta: eventData,
  });

  // shared context uses eventData; add common fields for convenience
  const context = {
    ...eventData,
    username: eventData.user || eventData.username,
    message: eventData.message,
    reward: eventData.reward,
  };

  // Execute automations sequentially (per matching document)
  for (const a of autos) {
    await logAutomationEvent(streamerId, {
      type: "automation_start",
      automationId: a._id.toString(),
      triggerType,
      triggerName,
    });

    for (const action of a.actions) {
      await execAction(streamerId, action, context);
    }

    await logAutomationEvent(streamerId, {
      type: "automation_end",
      automationId: a._id.toString(),
      triggerType,
      triggerName,
    });
  }
}

/* ─────────────────────────────────────────
   EventBus bindings (Twitch → Automations)
   Ensure your Twitch module emits:
   - "twitch.chat.command" with { command, user, message }
   - "twitch.redemption"   with { reward, user, cost, input }
────────────────────────────────────────── */
onEvent("twitch.chat.command", async (payload = {}) => {
  const { streamerId = "global" } = payload;
  await runAutomations(streamerId, "twitch.chat.command", payload);
});

onEvent("twitch.redemption", async (payload = {}) => {
  const { streamerId = "global" } = payload;
  await runAutomations(streamerId, "twitch.redemption", payload);
});
