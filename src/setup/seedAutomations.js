import { Automation } from "../models/Automation.js";

export async function seedAutomations() {
  const streamerId = "global";
  const autos = [
    // respond on !hydrate
    {
      streamerId,
      enabled: true,
      triggerType: "twitch.chat.command",
      triggerName: "hydrate",
      actions: [
        { type: "sendTwitchMessage", payload: { text: "💧 Stay hydrated, {username}!" } },
        { type: "delay", payload: { ms: 500 } },
        { type: "obsSceneSwitch", payload: { scene: "Hydrate" } },
      ],
    },
    // auto thank you for "gg"
    {
      streamerId,
      enabled: true,
      triggerType: "twitch.chat.message",
      conditions: { textIncludes: ["gg"], cooldownSec: 10 },
      actions: [{ type: "sendTwitchMessage", payload: { text: "Thanks for the GG, {username}! ✨" } }],
    },
  ];
  await Automation.insertMany(autos);
}
