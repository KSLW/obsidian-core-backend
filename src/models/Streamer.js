// src/models/Streamer.js
import mongoose from "mongoose";

const TwitchAuthSchema = new mongoose.Schema(
  {
    accessToken: { type: String },
    refreshToken: { type: String },
    scope: { type: [String], default: [] },
    obtainedAt: { type: Date },
    expiresIn: { type: Number },
  },
  { _id: false }
);

const TwitchBotSchema = new mongoose.Schema(
  {
    username: { type: String },
    channel: { type: String },
  },
  { _id: false }
);

const StreamerSchema = new mongoose.Schema(
  {
    ownerId: { type: String, index: true }, // internal app owner id (optional)
    twitchId: { type: String, index: true, unique: true, sparse: true },
    twitchUsername: { type: String },
    displayName: { type: String },

    twitchAuth: { type: TwitchAuthSchema, default: () => ({}) },
    twitchBot: { type: TwitchBotSchema, default: () => ({}) },

    moderation: {
      safetyLevel: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH"],
        default: "MEDIUM",
      },
      customBanned: { type: [String], default: [] },
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/**
 * Static helper: setTwitchAuth
 * For initial OAuth or re-link
 */
StreamerSchema.statics.setTwitchAuth = async function (twitchId, authData, botData) {
  return this.findOneAndUpdate(
    { twitchId },
    {
      twitchId,
      twitchAuth: authData,
      twitchBot: botData,
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
};

/**
 * Static helper: updateOrCreateByOwner
 * Useful when linking a Twitch account to an internal user
 */
StreamerSchema.statics.updateOrCreateByOwner = async function (ownerId, updates) {
  return this.findOneAndUpdate({ ownerId }, updates, { upsert: true, new: true });
};

export const Streamer = mongoose.models.Streamer || mongoose.model("Streamer", StreamerSchema);
