// src/models/Command.js
import mongoose from "mongoose";

const commandSchema = new mongoose.Schema(
  {
    streamerId: { type: String, required: true },
    name: { type: String, required: true, lowercase: true, trim: true },
    response: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    cooldown: { type: Number, default: 10 }, // seconds
    lastUsed: { type: Date, default: null },
    permissions: {
      type: String,
      enum: ["everyone", "subscribers", "mods", "owner"],
      default: "everyone",
    },
  },
  { timestamps: true }
);

commandSchema.index({ streamerId: 1, name: 1 }, { unique: true });

export const Command = mongoose.model("Command", commandSchema);
