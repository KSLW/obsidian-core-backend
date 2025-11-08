import mongoose from "mongoose";
import dotenv from "dotenv";
import { Automation } from "../models/Automation.js";

dotenv.config();

const seedData = [
  {
    streamerId: "global",
    enabled: true,
    triggerType: "twitch.chat.command",
    triggerName: "hello",
    actions: [
      { type: "sendTwitchMessage", payload: { text: "Hey {username}! 👋 Welcome to the stream!" } }
    ]
  },
  {
    streamerId: "global",
    enabled: true,
    triggerType: "twitch.chat.command",
    triggerName: "hydrate",
    actions: [
      { type: "sendTwitchMessage", payload: { text: "💧 Stay hydrated, {username}!" } },
      { type: "delay", payload: { ms: 1000 } },
      { type: "obsSceneSwitch", payload: { scene: "Hydrate" } }
    ]
  },
  {
    streamerId: "global",
    enabled: true,
    triggerType: "twitch.chat.command",
    triggerName: "lurk",
    actions: [
      { type: "sendTwitchMessage", payload: { text: "{username} has gone into lurk mode 👀" } },
      { type: "obsSceneSwitch", payload: { scene: "LurkMode" } }
    ]
  },
  {
    streamerId: "global",
    enabled: true,
    triggerType: "twitch.chat.command",
    triggerName: "back",
    actions: [
      { type: "sendTwitchMessage", payload: { text: "Welcome back, {username}! We missed you 💜" } },
      { type: "obsSceneSwitch", payload: { scene: "Main" } }
    ]
  },
  {
    streamerId: "global",
    enabled: true,
    triggerType: "twitch.chat.command",
    triggerName: "discord",
    actions: [
      { type: "sendTwitchMessage", payload: { text: "💬 Join our Discord community → https://discord.gg/YOURCODE" } }
    ]
  }
];


(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🍃 Connected to MongoDB");

    await Automation.deleteMany({ streamerId: "global" });
    await Automation.insertMany(seedData);
    console.log(`✅ Seeded ${seedData.length} automations.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
})();
