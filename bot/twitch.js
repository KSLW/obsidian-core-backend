const tmi = require("tmi.js");
const commandEngine = require("../engine/commandEngine");
const eventEngine = require("../engine/eventEngine");
const moduleEngine = require("../engine/moduleEngine");

let client = null;

async function startTwitchBot(settings) {
  if (!settings.twitch?.accessToken) {
    console.log("⚠️ Twitch bot not started (no token).");
    return;
  }

  client = new tmi.Client({
    identity: {
      username: settings.twitch.username,
      password: `oauth:${settings.twitch.accessToken}`
    },
    channels: [settings.twitch.channel]
  });

  client.on("message", async (channel, tags, message, self) => {
    if (self) return;

    await commandEngine.handleMessage({ client, channel, tags, message });
    await moduleEngine.runMessageHooks({ client, channel, tags, message });
    await eventEngine.handleEvent("message", { user: tags["display-name"] });
  });

  await client.connect();
  console.log("🟣 Twitch bot connected");
}

module.exports = { startTwitchBot };
