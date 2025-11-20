const mongoose = require("mongoose");

async function connectDB() {
  const URI = process.env.MONGO_URI || "mongodb://localhost:27017/obsidian";
  
  try {
    await mongoose.connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✓ Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

module.exports = connectDB;
