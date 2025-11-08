// backend/src/core/commands.js
import Datastore from "nedb-promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../data/commands.db");

const commandsDB = Datastore.create({ filename: dbPath, autoload: true });

/* ────────────────────────────────
   🧩 Command CRUD
──────────────────────────────── */
export async function getAllCommands(streamerId = "global") {
  return commandsDB.find({ streamerId });
}

export async function getCommand(streamerId, name) {
  return commandsDB.findOne({ streamerId, name });
}

export async function addCommand(streamerId, name, response) {
  const cmd = { streamerId, name: name.toLowerCase(), response, createdAt: Date.now() };
  await commandsDB.insert(cmd);
  return cmd;
}

export async function updateCommand(streamerId, name, response) {
  const cmd = await commandsDB.update({ streamerId, name }, { $set: { response } }, { returnUpdatedDocs: true });
  return cmd;
}

export async function deleteCommand(streamerId, name) {
  await commandsDB.remove({ streamerId, name });
  return true;
}
