const mongoose = require("mongoose");

const ModuleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  enabled: { type: Boolean, default: false }
});

module.exports =
  mongoose.models.Module || mongoose.model("Module", ModuleSchema);
