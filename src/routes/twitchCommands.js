// backend/src/routes/twitchCommands.js
import express from "express";
import {
  getAllCommands,
  getCommand,
  addCommand,
  updateCommand,
  deleteCommand,
} from "../core/commands.js";

const router = express.Router();

// 🟣 Get all commands
router.get("/:streamerId", async (req, res) => {
  const { streamerId } = req.params;
  const commands = await getAllCommands(streamerId);
  res.json(commands);
});

// 🟣 Add new command
router.post("/", async (req, res) => {
  const { streamerId, name, response } = req.body;
  if (!name || !response) return res.status(400).json({ error: "Missing fields" });
  const cmd = await addCommand(streamerId, name, response);
  res.json(cmd);
});

// 🟣 Update command
router.put("/", async (req, res) => {
  const { streamerId, name, response } = req.body;
  if (!name || !response) return res.status(400).json({ error: "Missing fields" });
  const cmd = await updateCommand(streamerId, name, response);
  res.json(cmd);
});

// 🟣 Delete command
router.delete("/", async (req, res) => {
  const { streamerId, name } = req.body;
  if (!name) return res.status(400).json({ error: "Missing fields" });
  await deleteCommand(streamerId, name);
  res.json({ success: true });
});

export default router;
