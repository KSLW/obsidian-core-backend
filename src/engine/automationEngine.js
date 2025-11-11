import { subscribeEvent, emitEvent } from "../core/eventBus.js";
import { Automation } from "../models/Automation.js";
import { checkAutomationConditions } from "./automationConditions.js";
import { runAutomation } from "./runAutomations.js";

export function attachAutomationListeners() {
  // chat message
  subscribeEvent("twitch.chat", async (payload) => {
    const { user, message } = payload;
    const streamerId = payload.streamerId || "global";
    const autos = await Automation.find({
      streamerId,
      enabled: true,
      triggerType: "twitch.chat.message",
    });
    for (const a of autos) {
      if (!(await checkAutomationConditions(a, payload))) continue;
      await runAutomation(a, { user, message });
    }
  });

  // chat command
  subscribeEvent("twitch.chat.command", async (payload) => {
    const { user, command } = payload;
    const streamerId = payload.streamerId || "global";
    const autos = await Automation.find({
      streamerId,
      enabled: true,
      triggerType: "twitch.chat.command",
      triggerName: command,
    });
    for (const a of autos) {
      if (!(await checkAutomationConditions(a, payload))) continue;
      await runAutomation(a, { user, command });
    }
  });

  // channel point redemption
  subscribeEvent("twitch.redemption", async (payload) => {
    const { user, rewardTitle } = payload;
    const streamerId = payload.streamerId || "global";
    const autos = await Automation.find({
      streamerId,
      enabled: true,
      triggerType: "twitch.redemption",
      triggerName: rewardTitle,
    });
    for (const a of autos) {
      if (!(await checkAutomationConditions(a, payload))) continue;
      await runAutomation(a, { user, rewardTitle });
    }
  });
}
