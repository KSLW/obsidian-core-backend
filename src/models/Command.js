import mongoose from "mongoose";

const commandSchema = new mongoose.Schema(
  {
    streamerId: { type: String, required: true },
    name: { type: String, required: true, lowercase: true, trim: true },
    response: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    cooldown: { type: Number, default: 10 },
    lastUsed: { type: Date, default: null },
    isGlobal: { type: Boolean, default: false }, // 👈 add this
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
