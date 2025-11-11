import { delay } from "../core/utils.js";
import { markAutomationTriggered } from "./automationConditions.js";
import { sendTwitchMessage } from "../modules/twitch/index.js";
import { emitEvent } from "../core/eventBus.js";

export async function runAutomation(auto, ctx = {}) {
  for (const action of auto.actions || []) {
    const { type, payload = {} } = action;

    if (type === "sendTwitchMessage") {
      const text = (payload.text || "")
        .replace("{username}", ctx.user || "")
        .replace("{message}", ctx.message || "")
        .replace("{command}", ctx.command || "");
      await sendTwitchMessage(text);
    }

    else if (type === "delay") {
      await delay(Number(payload.ms || 0));
    }

    else if (type === "obsSceneSwitch") {
      // up to your OBS module to listen for this bus event
      emitEvent(ctx.streamerId || "global", "obs.scene.switch", { scene: payload.scene });
    }

    // add more actions here...
  }
  markAutomationTriggered(auto);
}
