const fs = require("fs");
const path = require("path");
const ModuleModel = require("../models/Module");

let activeModules = [];

async function loadModules() {
  console.log("🔍 Loading modules...");

  // Load from database
  const enabledModules = await ModuleModel.find({ enabled: true });
  const enabledIds = enabledModules.map(m => m.id);

  const modulesPath = path.join(__dirname, "../modules");

  const moduleFiles = fs.readdirSync(modulesPath)
    .filter(f => f.endsWith(".module.js"));

  activeModules = [];

  for (const file of moduleFiles) {
    const mod = require(path.join(modulesPath, file));

    // Only load modules enabled in DB
    if (!enabledIds.includes(mod.id)) {
      console.log(`- Skipping module: ${mod.name}`);
      continue;
    }

    activeModules.push(mod);

    if (typeof mod.onLoad === "function") {
      await mod.onLoad();
    }

    console.log(`✓ Loaded module: ${mod.name}`);
  }
}

function getActiveModules() {
  return activeModules;
}

async function runMessageHooks(payload) {
  for (const mod of activeModules) {
    if (typeof mod.onMessage === "function") {
      await mod.onMessage(payload);
    }
  }
}

async function runEventHooks(type, payload) {
  for (const mod of activeModules) {
    if (typeof mod.onEvent === "function") {
      await mod.onEvent(type, payload);
    }
  }
}

module.exports = {
  loadModules,
  getActiveModules,
  runMessageHooks,
  runEventHooks,
};
