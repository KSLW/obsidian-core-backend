const fs = require("fs");
const path = require("path");

let activeModules = [];

async function loadModules() {
  console.log("🔍 Loading modules...");

  const folder = path.join(__dirname, "../modules");
  const files = fs.readdirSync(folder).filter(f => f.endsWith(".module.js"));

  activeModules = [];

  for (const file of files) {
    const mod = require(path.join(folder, file));

    if (!mod.enabled) {
      console.log(`- Skipping disabled module: ${mod.name}`);
      continue;
    }

    activeModules.push(mod);

    if (typeof mod.onLoad === "function") {
      await mod.onLoad();
    }

    console.log(`✓ Loaded module: ${mod.name}`);
  }
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
  runMessageHooks,
  runEventHooks
};
