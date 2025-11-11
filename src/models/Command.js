import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    streamerId: { type: String, required: true, index: true },
    name: { type: String, required: true, lowercase: true, trim: true },
    response: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    cooldown: { type: Number, default: 10 },
    lastUsed: { type: Date, default: null },
    permissions: {
      type: String,
      enum: ["everyone", "subscribers", "mods", "owner"],
      default: "everyone",
    },
  },
  { timestamps: true }
);

schema.index({ streamerId: 1, name: 1 }, { unique: true });

export const Command = mongoose.models.Command || mongoose.model("Command", schema);
