const Event = require("../models/Event");
const { runEventHooks } = require("./moduleEngine");

module.exports = {
  async handleEvent(type, data = {}) {
    const evt = await Event.findOne({ type, enabled: true });
    if (!evt) return;

    let msg = evt.message
      .replace("{user}", data.user || "Someone")
      .replace("{months}", data.months || "0");

    console.log(`[EVENT:${type}] → ${msg}`);

    await runEventHooks(type, data);

    // In the future:
    // - send to Twitch
    // - send to Discord
    // - send to overlay
  }
};
