require("dotenv").config();
const express = require("express");
const cors = require("cors");

const commandsRoutes = require("./api/commands");
const eventsRoutes = require("./api/events");
const modulesRoutes = require("./api/modules");
const settingsRoutes = require("./api/settings");
const Settings = require("./models/Settings");
const connectDB = require("./db/mongoose");
const { startTwitchBot } = require("./bot/twitch");
const { startDiscordBot } = require("./bot/discord");
const { loadModules } = require("./engine/moduleEngine");

async function start() {
  await connectDB();
  await loadModules();

  if (process.env.TWITCH_BOT_USERNAME) {
    startTwitchBot();
  }

  if (process.env.DISCORD_TOKEN) {
    startDiscordBot();
  }

  console.log("✓ Obsidian backend fully initialized");
}

start();


const app = express();
const PORT = process.env.PORT || 4000;
Settings.getSettings(); // ensures it exists


// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/commands", commandsRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/modules", modulesRoutes);
app.use("/api/settings", settingsRoutes);

app.listen(PORT, () => {
  console.log(`Obsidian backend listening on port ${PORT}`);
});
