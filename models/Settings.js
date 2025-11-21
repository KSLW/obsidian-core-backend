const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  prefix: { type: String, default: "!" },
  announcementsEnabled: { type: Boolean, default: true },
  aiResponses: { type: Boolean, default: false },

  twitch: {
    username: String,
    channel: String,
  },

  discord: {
    botEnabled: { type: Boolean, default: false }
  },

  // --- NEW ---
  twitchAuth: {
    accessToken: String,
    refreshToken: String,
    expiresIn: Number,
    obtainedAt: Number,
    scope: [String],
  },

  discordAuth: {
    accessToken: String,
    refreshToken: String,
    expiresIn: Number,
    obtainedAt: Number,
    scope: [String],
  },

  theme: { type: String, default: "dark" },
  customTheme: {
    primary: String,
    secondary: String,
    background: String,
    text: String,
  },
});

SettingsSchema.statics.get = async function() {
  let s = await this.findOne();
  if (!s) {
    s = await this.create({
      prefix: "!",
      announcementsEnabled: true,
      aiResponses: false,
      twitch: {},
      discord: {},
      theme: "dark",
      customTheme: {
        primary: "#8e7cff",
        secondary: "#7d6cff",
        background: "#1a1a1a",
        text: "#ffffff"
      }
    });
  }
  return s;
};


module.exports = mongoose.model("Settings", SettingsSchema);
