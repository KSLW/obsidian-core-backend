// db/mongo.js
import mongoose from "mongoose";

let connected = false;

export async function connectMongo() {
  if (connected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️ MONGODB_URI missing — moderation will not persist.");
    return;
  }
  await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000,
  });
  connected = true;
  console.log("🍃 Mongo connected");
}
