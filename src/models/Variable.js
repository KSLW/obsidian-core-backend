// src/models/Variable.js
import mongoose from "mongoose";

const variableSchema = new mongoose.Schema(
  {
    streamerId: { type: String, required: true, index: true },
    name: { type: String, required: true, lowercase: true, trim: true },
    value: { type: String, default: "" },
    type: {
      type: String,
      enum: ["text", "counter"],
      default: "text",
    },
  },
  { timestamps: true }
);

variableSchema.index({ streamerId: 1, name: 1 }, { unique: true });

export const Variable =
  mongoose.models.Variable || mongoose.model("Variable", variableSchema);
