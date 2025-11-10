// src/models/EventSub.js
import mongoose from "mongoose";

const EventSubSchema = new mongoose.Schema(
  {
    broadcasterId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    status: { type: String, default: "enabled" },
    subscriptionId: { type: String, required: true },
  },
  { timestamps: true }
);

export const EventSub = mongoose.models.EventSub || mongoose.model("EventSub", EventSubSchema);
