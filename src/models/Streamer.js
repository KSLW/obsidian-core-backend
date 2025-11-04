import Datastore from "@seald-io/nedb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config({ path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.local"});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Datastore({
  filename: path.join(dataDir, "streamers.db"),
  autoload: true,
});

export const Streamer = {
  async find(q = {}) { return db.findAsync(q); },
  async findOne(q = {}) { return db.findOneAsync(q); },
  async create(data) {
    if (data.ownerId) {
      const existing = await db.findOneAsync({ ownerId: data.ownerId });
      if (existing) return existing;
    }
    return db.insertAsync({ ...data, createdAt: Date.now(), updatedAt: Date.now() });
  },
  async upsertByOwnerId(ownerId, update) {
    const existing = await db.findOneAsync({ ownerId });
    if (existing) {
      await db.updateAsync({ _id: existing._id }, { $set: { ...update, updatedAt: Date.now() } });
      return db.findOneAsync({ _id: existing._id });
    }
    return db.insertAsync({ ownerId, ...update, createdAt: Date.now(), updatedAt: Date.now() });
  },
  async update(id, updates) {
    await db.updateAsync({ _id: id }, { $set: { ...updates, updatedAt: Date.now() } });
    return db.findOneAsync({ _id: id });
  },
  async remove(id) { return db.removeAsync({ _id: id }, {}); },
};
