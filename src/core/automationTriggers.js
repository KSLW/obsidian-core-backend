// backend/src/core/automationTriggers.js
import { onEvent } from "./eventBus.js";
import { runAutomations } from "../engine/automations.js";

/**
 * Hook Twitch + OBS + Discord events into automation runner
 */
export function registerAutomationTriggers() {
  onEvent("twitchRedemption", async (data) => {
    console.log(`⚙️ Automation trigger: Twitch Redemption → ${data.reward}`);
    await runAutomations("twitchRedemption", data);
  });

  onEvent("twitchCommand", async (data) => {
    console.log(`⚙️ Automation trigger: Twitch Command → ${data.command}`);
    await runAutomations("twitchCommand", data);
  });

  onEvent("obsSceneChanged", async (data) => {
    console.log(`🎬 Automation trigger: Scene Changed → ${data.scene}`);
    await runAutomations("obsSceneChanged", data);
  });
}
