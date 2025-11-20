const mongoose = require("mongoose");

const CommandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  response: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  cooldown: { type: Number, default: 0 },        // seconds
  userLevel: { type: String, default: "everyone" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Command", CommandSchema);
