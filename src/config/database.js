import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: process.env.ENV_PATH || ".env" });

export async function connectMongo() {
  const uri = process.env.MONGODB_URL;
  if (!uri) throw new Error("Missing MONGODB_URL");
  await mongoose.connect(uri, { autoIndex: true });
  console.log("🍃 Mongo connected");
}
