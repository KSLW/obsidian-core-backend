import { Command } from "../models/Command.js";
import { Automation } from "../models/Automation.js";
import { seedCommands } from "./seedCommands.js";
import { seedAutomations } from "./seedAutomations.js";

export async function autoSeedAll() {
  const [c, a] = await Promise.all([
    Command.countDocuments(),
    Automation.countDocuments(),
  ]);

  if (a === 0) {
    await seedAutomations();
    console.log("🌱 Seeded automations.");
  } else {
    console.log(`✅ ${a} automations found — skipping seed.`);
  }

  if (c === 0) {
    await seedCommands();
    console.log("🌱 Seeded commands.");
  } else {
    console.log(`✅ ${c} commands found — skipping seed.`);
  }
}
