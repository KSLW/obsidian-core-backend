const fs = require("fs");
const path = require("path");
const ModuleModel = require("../models/Module");

let activeModules = [];

async function loadModules() {
  console.log("🔍 Loading modules...");

  // Load module list from DB
  const enabledModules = await ModuleModel.find({ enabled: true });
  const enabledIds = enabledModules.map(m => m.id);

  const moduleFiles = fs.readdirSync(path.join(__dirname, "../modules"))
    .filter(f => f.endsWith(".module.js"));

  activeModules = [];

  for (const file of moduleFiles) {
    const mod = require(path.join(__dirname, "../modules", file));

    if (!enabledIds.includes(mod.id)) {
      console.log(`- Skipping module: ${mod.name}`);
      continue;
    }

    activeModules.push(mod);

    if (typeof mod.onLoad === "function") {
      mod.onLoad();
    }

    console.log(`✓ Loaded module: ${mod.name}`);
  }
}

function getActiveModules() {
  return activeModules;
}

// Run message hook
async function runMessageHooks(payload) {
  for (const mod of activeModules) {
    if (typeof mod.onMessage === "function") {
      await mod.onMessage(payload);
    }
  }
}

// Run event hook
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
  runEventHooks
};
