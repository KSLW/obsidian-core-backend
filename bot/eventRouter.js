const eventEngine = require("../engine/eventEngine");

module.exports = {
  async routeTwitchEvent({ client, channel, tags, message }) {
    // Basic example
    if (tags["msg-id"] === "sub") {
      await eventEngine.handleEvent("Sub", {
        user: tags["display-name"],
        months: tags["msg-param-cumulative-months"]
      });
    }

    // TODO:
    // - follow event via PubSub/Helix
    // - raids
    // - bits
    // - ads
  }
};
