const mongoose = require("mongoose");

const CommandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  trigger: { type: String, required: true },
  response: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  cooldown: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports =
  mongoose.models.Command || mongoose.model("Command", CommandSchema);
