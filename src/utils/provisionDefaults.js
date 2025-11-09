// src/utils/provisionDefaults.js
import { Command } from "../models/Command.js";
import { Automation } from "../models/Automation.js";
import { logSystemEvent } from "../core/logger.js";

/**
 * Ensure a streamer has base commands and automations on first connection.
 * This runs once per streamer (idempotent).
 */
export async function provisionDefaultsForStreamer(streamerId) {
  try {
    if (!streamerId) {
      console.warn("⚠️ provisionDefaultsForStreamer called with no streamerId.");
      return;
    }

    console.log(`🧩 Provisioning defaults for streasrc/mer: ${streamerId}`);

    // ────────────────
    //  Commands
    // ────────────────
    const defaultCommands = [
      {
        name: "hello",
        response: "Hey {username}! 👋 Welcome to the stream!",
      },
      {
        name: "hydrate",
        response: "💧 Stay hydrated, {username}!",
      },
      {
        name: "lurk",
        response: "👀 Thanks for the lurk, {username}! Enjoy your chill time.",
      },
      {
        name: "discord",
        response: "Join the community Discord → https://discord.gg/YOURINVITE",
      },
    ];

    for (const cmd of defaultCommands) {
      const exists = await Command.findOne({ streamerId, name: cmd.name });
      if (!exists) {
        await Command.create({
          streamerId,
          ...cmd,
          enabled: true,
          permissions: "everyone",
        });
      }
    }

    // ────────────────
    //  Automations
    // ────────────────
    const defaultAutomations = [
      {
        streamerId,
        triggerType: "twitch.chat.command",
        triggerName: "hydrate",
        enabled: true,
        actions: [
          {
            type: "sendTwitchMessage",
            payload: { text: "💧 Stay hydrated, {username}!" },
          },
          {
            type: "delay",
            payload: { ms: 1000 },
          },
          {
            type: "obsSceneSwitch",
            payload: { scene: "Hydrate" },
          },
        ],
      },
      {
        streamerId,
        triggerType: "twitch.chat.command",
        triggerName: "shoutout",
        enabled: true,
        actions: [
          {
            type: "sendTwitchMessage",
            payload: { text: "📣 Go follow @{username}! Spread the love ❤️" },
          },
        ],
      },
    ];

    for (const auto of defaultAutomations) {
      const exists = await Automation.findOne({
        streamerId,
        triggerType: auto.triggerType,
        triggerName: auto.triggerName,
      });
      if (!exists) {
        await Automation.create(auto);
      }
    }

    console.log(`✅ Provisioned defaults for streamer ${streamerId}`);
    await logSystemEvent("provision_defaults", { streamerId, status: "ok" });
  } catch (err) {
    console.error("❌ Failed to provision defaults:", err.message);
    await logSystemEvent("provision_defaults_failed", { error: err.message });
  }
}
