// src/config/database.js
import mongoose from "mongoose";

export async function connectMongo() {
  const uri = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/obsidian_core";
  await mongoose.connect(uri, {
    autoIndex: true,
  });
  console.log("🍃 Mongo connected");
}
