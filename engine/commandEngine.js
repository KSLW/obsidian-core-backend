const Command = require("../models/Command");

module.exports = {
  async handleMessage({ client, channel, tags, message }) {
    const settings = await Command.find({ enabled: true });

    for (const cmd of settings) {
      if (!cmd.trigger) continue;

      const parts = message.trim().split(" ");
      const triggerWord = parts[0].toLowerCase();

      if (triggerWord === cmd.trigger.toLowerCase()) {
        const response = cmd.response
          .replace("{user}", tags["display-name"] || "user");

        client.say(channel, response);
      }
    }
  }
};
