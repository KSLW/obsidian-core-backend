// src/models/Streamer.js
import mongoose from "mongoose";

const TwitchAuthSchema = new mongoose.Schema(
  {
    accessToken: String,
    refreshToken: String,
    scope: [String],
    obtainedAt: Date,
    expiresAt: Date, // when the user token expires
  },
  { _id: false }
);

const TwitchBotSchema = new mongoose.Schema(
  {
    username: String, // channel login (lowercase)
    channel: String,  // usually same as username
  },
  { _id: false }
);

const DiscordAuthSchema = new mongoose.Schema(
  {
    accessToken: String,
    refreshToken: String,
    scope: [String],
    obtainedAt: Date,
    expiresAt: Date,
  },
  { _id: false }
);

const StreamerSchema = new mongoose.Schema(
  {
    ownerId: { type: String, index: true, unique: true }, // Twitch user id (primary identity)
    displayName: String,

    // Twitch
    twitchAuth: TwitchAuthSchema,
    twitchBot: TwitchBotSchema,

    // Discord (optional)
    discordAuth: DiscordAuthSchema,

    // Moderation + misc (kept minimal; your moderation module owns details)
    settings: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

/* ─────────────────────────────────────────
   Static helpers
────────────────────────────────────────── */
StreamerSchema.statics.updateOrCreateByOwner = async function (ownerId, update) {
  return this.findOneAndUpdate(
    { ownerId },
    { $set: update },
    { upsert: true, new: true }
  ).lean(false);
};

StreamerSchema.statics.setTwitchAuth = async function (ownerId, auth, bot = null) {
  const patch = {
    twitchAuth: {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      scope: auth.scope || [],
      obtainedAt: new Date(auth.obtainedAt || Date.now()),
      // store absolute expiry to avoid guessing
      expiresAt: auth.expiresIn
        ? new Date(Date.now() + auth.expiresIn * 1000)
        : auth.expiresAt || null,
    },
  };
  if (bot) patch.twitchBot = bot;

  return this.findOneAndUpdate(
    { ownerId },
    { $set: patch },
    { upsert: true, new: true }
  ).lean(false);
};

StreamerSchema.statics.setDiscordAuth = async function (ownerId, auth) {
  return this.findOneAndUpdate(
    { ownerId },
    {
      $set: {
        discordAuth: {
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          scope: auth.scope || [],
          obtainedAt: new Date(auth.obtainedAt || Date.now()),
          expiresAt: auth.expiresIn
            ? new Date(Date.now() + auth.expiresIn * 1000)
            : auth.expiresAt || null,
        },
      },
    },
    { upsert: true, new: true }
  ).lean(false);
};

StreamerSchema.statics.getActiveStreamer = async function () {
  return this.findOne({ "twitchAuth.accessToken": { $exists: true } })
    .sort({ updatedAt: -1 })
    .lean(false);
};

export const Streamer =
  mongoose.models.Streamer || mongoose.model("Streamer", StreamerSchema);
