const tmi = require("tmi.js");
const commandEngine = require("../engine/commandEngine");
const eventRouter = require("./eventRouter");
const moduleEngine = require("../engine/moduleEngine");

let client = null;

async function startTwitchBot() {
  const opts = {
    connection: { reconnect: true },
    identity: {
      username: process.env.TWITCH_BOT_USERNAME,
      password: process.env.TWITCH_OAUTH,
    },
    channels: [process.env.TWITCH_CHANNEL]
  };

  client = new tmi.Client(opts);

  client.on("message", async (channel, tags, message, self) => {
  if (self) return;

  // 1. Run command engine
  await commandEngine.handleMessage({ client, channel, tags, message });

  // 2. Run module message hooks
  await moduleEngine.runMessageHooks({ client, channel, tags, message });

  // 3. Route Twitch system events
  await eventRouter.routeTwitchEvent({ client, channel, tags, message });
});

  await client.connect();
  console.log("✓ Twitch bot connected");
}

module.exports = { startTwitchBot };
