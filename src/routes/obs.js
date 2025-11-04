import express from "express";
import { listScenes, getCurrentScene, changeScene, toggleSource, toggleMute, isOBSConnected } from "../modules/obs/index.js";

const router = express.Router();

router.get("/scenes", async (_req, res) => {
  try {
    if (!isOBSConnected()) return res.status(400).json({ error: "OBS not connected" });
    const scenes = await listScenes();
    res.json({ scenes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/current", async (_req, res) => {
  try {
    if (!isOBSConnected()) return res.status(400).json({ error: "OBS not connected" });
    const scene = await getCurrentScene();
    res.json({ currentScene: scene });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/scene", async (req, res) => {
  try { await changeScene(req.body.scene); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/source/toggle", async (req, res) => {
  try { const visible = await toggleSource(req.body.source); res.json({ visible }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/audio/toggle", async (req, res) => {
  try { const unmuted = await toggleMute(req.body.input); res.json({ unmuted }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
