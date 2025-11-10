// src/engine/automationEngine.js
import { Automation } from "../models/Automation.js";
import { emitEvent, subscribeEvent } from "../core/eventBus.js";
import { sendTwitchMessage } from "../modules/twitch/index.js";
import { logAutomationEvent } from "../core/logger.js";

/**
 * Executes an automation's actions in sequence
 */
async function executeAutomation(automation, context = {}) {
  for (const action of automation.actions) {
    const { type, payload } = action;
    try {
      switch (type) {
        case "sendTwitchMessage":
          if (payload?.text) {
            const msg = payload.text.replace("{username}", context.user || "user");
            await sendTwitchMessage(msg, context.channel);
          }
          break;

        case "delay":
          await new Promise((res) => setTimeout(res, payload?.ms || 1000));
          break;

        case "obsSceneSwitch":
          emitEvent(context.streamerId, "obs.scene.switch", payload);
          break;

        default:
          console.warn(`⚠️ Unknown automation action type: ${type}`);
      }

      await logAutomationEvent(automation.streamerId, {
        triggerType: automation.triggerType,
        triggerName: automation.triggerName,
        actionType: type,
        context,
      });
    } catch (err) {
      console.error(`❌ Failed to execute action ${type}:`, err.message);
    }
  }
}

/**
 * Core handler to run automations by trigger
 */
async function handleTrigger(triggerType, triggerName, context = {}) {
  const streamerId = context.streamerId || "global";

  const automations = await Automation.find({
    streamerId,
    triggerType,
    ...(triggerName ? { triggerName } : {}),
    enabled: true,
  });

  if (!automations.length) return;

  for (const automation of automations) {
    await executeAutomation(automation, context);
  }
}

/**
 * Attach listeners to handle Twitch → automation mapping
 */
export function attachAutomationListeners() {
  // Twitch chat command trigger
  subscribeEvent("twitch.chat.command", async (data) => {
    await handleTrigger("twitch.chat.command", data.command, {
      streamerId: data.streamerId,
      user: data.user,
      channel: data.channel,
    });
  });

  // Twitch channel point redemptions
  subscribeEvent("twitch.redemption", async (data) => {
    await handleTrigger("twitch.redemption", data.reward_title, {
      streamerId: data.streamerId,
      user: data.user,
    });
  });

  // Twitch follows
  subscribeEvent("twitch.follow", async (data) => {
    await handleTrigger("twitch.follow", null, {
      streamerId: data.streamerId,
      user: data.user_name,
    });
  });

  // Twitch subs
  subscribeEvent("twitch.subscribe", async (data) => {
    await handleTrigger("twitch.subscribe", null, {
      streamerId: data.streamerId,
      user: data.user_name,
    });
  });

  // Twitch raids
  subscribeEvent("twitch.raid", async (data) => {
    await handleTrigger("twitch.raid", null, {
      streamerId: data.streamerId,
      user: data.from_broadcaster_user_name,
      viewers: data.viewers,
    });
  });

  console.log("🎛️ Automation engine listeners active");
}
