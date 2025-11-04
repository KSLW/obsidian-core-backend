import Datastore from "@seald-io/nedb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "../../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Datastore({ filename: path.join(dataDir, "commands.db"), autoload: true });

export const Command = {
  async find(q = {}) { return db.findAsync(q); },
  async findOne(q = {}) { return db.findOneAsync(q); },
  async create(data) { return db.insertAsync({ ...data, createdAt: Date.now(), updatedAt: Date.now(), enabled: data.enabled !== false }); },
  async update(id, updates) {
    await db.updateAsync({ _id: id }, { $set: { ...updates, updatedAt: Date.now() } });
    return db.findOneAsync({ _id: id });
  },
  async remove(id) { return db.removeAsync({ _id: id }, {}); },
};
