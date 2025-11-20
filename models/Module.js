const mongoose = require("mongoose");

const ModuleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },   // internal ID, used by engine
  name: { type: String, required: true },                // human-friendly name
  description: { type: String, default: "" },
  enabled: { type: Boolean, default: false },            // toggle module on/off
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Module", ModuleSchema);
