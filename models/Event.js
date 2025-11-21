const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  type: { type: String, required: true },
  message: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports =
  mongoose.models.Event || mongoose.model("Event", EventSchema);
