// backend/src/models/Streamer.js
import mongoose from "mongoose";

const streamerSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, unique: true },
  displayName: String,
  twitchAuth: {
    accessToken: String,
    refreshToken: String,
    expiresIn: Number,
    obtainedAt: Date,
  },
  twitchBot: {
    username: String,
    channel: String,
  },
  discordAuth: {
    accessToken: String,
    refreshToken: String,
    expiresIn: Number,
    obtainedAt: Date,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 🔹 Helper to create or update streamer in one call
streamerSchema.statics.updateOrCreate = async function (query, data) {
  const existing = await this.findOne(query);
  if (existing) {
    Object.assign(existing, data, { updatedAt: Date.now() });
    return await existing.save();
  } else {
    return await this.create({ ...query, ...data, createdAt: Date.now() });
  }
};

// 🔹 Helper to update specific fields
streamerSchema.statics.updateFields = async function (ownerId, data) {
  return await this.findOneAndUpdate({ ownerId }, data, { new: true });
};

export const Streamer =
  mongoose.models.Streamer || mongoose.model("Streamer", streamerSchema);
