const { Client, GatewayIntentBits } = require("discord.js");
let client = null;

async function startDiscordBot(settings) {
  if (!settings.discord?.botToken) {
    console.log("⚠️ Discord bot not started (no token).");
    return;
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  client.once("ready", () => {
    console.log(`🔵 Discord bot logged in as ${client.user.tag}`);
  });

  client.on("messageCreate", (msg) => {
    if (msg.author.bot) return;

    // reserved for future features
  });

  await client.login(settings.discord.botToken);
}

module.exports = { startDiscordBot };
