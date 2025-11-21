const fs = require("fs");
const path = require("path");

const SETTINGS_FILE = path.join(__dirname, "..", "data", "settings.json");

function ensureFile() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    const defaults = {
      twitchClientId: "",
      twitchClientSecret: "",
      discordClientId: "",
      discordClientSecret: "",

      twitchAuth: null,
      discordAuth: null
    };

    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaults, null, 2));
  }
}

async function getSettings() {
  ensureFile();
  const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
  return JSON.parse(raw);
}

async function updateSettings(partial) {
  ensureFile();
  const current = await getSettings();
  const updated = { ...current, ...partial };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2));
  return updated;
}

module.exports = { getSettings, updateSettings };
