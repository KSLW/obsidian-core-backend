import { Command } from "../models/Command.js";

export async function seedCommands() {
  const streamerId = "global";
  const base = [
    { name: "hello", response: "Hey {username}! 👋" },
    { name: "hydrate", response: "💧 Stay hydrated, {username}!" },
    { name: "so", response: "Go follow {username} at https://twitch.tv/{username}" },
    { name: "discord", response: "Join our Discord: https://discord.gg/yourlink" },
    { name: "twitter", response: "Follow on X/Twitter: https://twitter.com/yourhandle" },
    { name: "yt", response: "Subscribe on YouTube: https://youtube.com/@yourchannel" },
    { name: "rules", response: "Be kind. No hate. Mods have final say." },
    { name: "schedule", response: "I stream Thu–Sat; see the panels for times!" },
  ];
  await Command.insertMany(base.map((c) => ({ streamerId, enabled: true, ...c })));
}
