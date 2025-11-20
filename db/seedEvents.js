// backend/db/seedEvents.js
require("dotenv").config();
const mongoose = require("mongoose");
const Event = require("../models/Event");
const connectDB = require("./mongoose");

const defaultEvents = [
  {
    type: "Follow",
    message: "👋 Welcome {user}! Thanks for the follow!",
    enabled: true,
  },
  {
    type: "Sub",
    message: "❤️ {user} just subscribed! Absolute legend!",
    enabled: true,
  },
  {
    type: "ReSub",
    message: "🔥 {user} resubbed for {months} months! Thank you!!",
    enabled: true,
  },
  {
    type: "GiftSub",
    message: "🎁 {user} gifted a sub! You're amazing!",
    enabled: true,
  },
  {
    type: "MassGift",
    message: "🎁 {user} just gifted {amount} subs!! HYPE!",
    enabled: true,
  },
  {
    type: "Raid",
    message: "⚔️ Raid alert! {user} brought {viewers} warriors!",
    enabled: true,
  },
  {
    type: "Bits",
    message: "💎 {user} cheered {amount} bits! Thank you!",
    enabled: true,
  }
];

async function seedEvents() {
  await connectDB();

  console.log("🌱 Seeding default events...\n");

  for (const evt of defaultEvents) {
    const exists = await Event.findOne({ type: evt.type });

    if (exists) {
      console.log(`⏭  Skipped: ${evt.type} (already exists)`);
      continue;
    }

    await Event.create(evt);
    console.log(`✅ Added: ${evt.type}`);
  }

  console.log("\n🎉 Event seeding complete.");
  mongoose.connection.close();
}

seedEvents();
