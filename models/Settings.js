const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  prefix: { type: String, default: "!" },
  announcementsEnabled: { type: Boolean, default: true },
  aiResponses: { type: Boolean, default: false },

  // Future expansion
  twitch: {
    username: { type: String, default: "" },
    channel: { type: String, default: "" }
  },

  discord: {
    botEnabled: { type: Boolean, default: false }
  },

  updatedAt: { type: Date, default: Date.now }
});

// Force single settings document
SettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model("Settings", SettingsSchema);
