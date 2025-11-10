// src/core/variables.js
import { Variable } from "../models/Variable.js";

export async function getVariable(streamerId, name) {
  const v = await Variable.findOne({ streamerId, name });
  return v?.value ?? null;
}

export async function setVariable(streamerId, name, value, type = "text") {
  const updated = await Variable.findOneAndUpdate(
    { streamerId, name },
    { value, type },
    { upsert: true, new: true }
  );
  return updated.value;
}

export async function incrementVariable(streamerId, name, amount = 1) {
  const v = await Variable.findOneAndUpdate(
    { streamerId, name },
    { $inc: { __counter: amount } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Store as string (for template usage)
  v.value = String((parseInt(v.value || "0") || 0) + amount);
  await v.save();
  return v.value;
}

export async function listVariables(streamerId) {
  return await Variable.find({ streamerId });
}
