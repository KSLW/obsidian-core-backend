const { Client, GatewayIntentBits } = require("discord.js");

let client = null;

async function startDiscordBot() {
  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  client.once("ready", () => {
    console.log(`✓ Discord bot logged in as ${client.user.tag}`);
  });

  client.on("messageCreate", async (message) => {
    // Skip bot messages
    if (message.author.bot) return;

    // The command engine will handle bot commands later
    // Example:
    // if (message.content.startsWith("!ping")) {
    //   message.reply("Pong!");
    // }
  });

  await client.login(process.env.DISCORD_TOKEN);
}

module.exports = { startDiscordBot };
