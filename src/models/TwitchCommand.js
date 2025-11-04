// backend/src/models/TwitchCommand.js
import Datastore from "@seald-io/nedb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "../../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Datastore({
  filename: path.join(dataDir, "twitch_commands.db"),
  autoload: true,
});

export const TwitchCommand = {
  async find(q = {}) {
    return await db.findAsync(q);
  },
  async findOne(q = {}) {
    return await db.findOneAsync(q);
  },
  async create(data) {
    // prevent exact duplicate name per streamer
    const exists = await db.findOneAsync({
      streamerId: data.streamerId,
      name: data.name.toLowerCase(),
    });
    if (exists) return exists;

    return await db.insertAsync({
      enabled: true,
      cooldown: 0,
      actions: [],
      response: "",
      aliases: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...data,
      name: data.name.toLowerCase(),
    });
  },
  async update(id, updates) {
    await db.updateAsync(
      { _id: id },
      { $set: { ...updates, updatedAt: Date.now() } },
      {}
    );
    return await db.findOneAsync({ _id: id });
  },
  async remove(id) {
    return await db.removeAsync({ _id: id }, {});
  },
};
