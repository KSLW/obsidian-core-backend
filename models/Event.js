const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },  // "Sub", "Follow", "Raid", etc.
  message: { type: String, default: "" },                // "Thanks {user} for subbing!"
  enabled: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Event", EventSchema);
