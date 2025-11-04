// backend/src/models/Streamer.js
import Datastore from "nedb-promises";

const db = Datastore.create({
  filename: process.env.DATA_DIR
    ? `${process.env.DATA_DIR}/streamers.db`
    : "./src/data/streamers.db",
  autoload: true,
});

export const Streamer = {
  // Fetch all streamers
  async find(query = {}) {
    return await db.find(query);
  },

  // Fetch single streamer
  async findOne(query) {
    return await db.findOne(query);
  },

  // Insert new streamer
  async create(data) {
    return await db.insert(data);
  },

  // Update existing streamer
  async update(id, data) {
    return await db.update({ _id: id }, { $set: data });
  },

  // List all streamers
  async findAll() {
    return await db.find({});
  },

  // Upsert behavior
  async updateOrCreate(query, data) {
    const existing = await db.findOne(query);
    if (existing) {
      await db.update({ _id: existing._id }, { $set: data });
      return { ...existing, ...data };
    } else {
      return await db.insert(data);
    }
  },
};
