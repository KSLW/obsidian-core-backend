import mongoose from "mongoose";

const LogSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true }, // system | twitch | discord
    type: { type: String, required: true },     // system | twitch | discord
    subtype: { type: String, default: "" },     // connected | message | command...
    streamerId: { type: String, default: "global" },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Log = mongoose.models.Log || mongoose.model("Log", LogSchema);
