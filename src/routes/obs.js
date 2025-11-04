import express from "express";
import {
  listScenes,
  getCurrentScene,
  changeScene,
  toggleSource,
  isObsConnected,
} from "../modules/obs/index.js";

const router = express.Router();

router.get("/scenes", async (_req, res) => {
  try {
    if (!isObsConnected()) return res.status(400).json({ error: "OBS not connected" });
    const scenes = await listScenes();
    res.json({ scenes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/current", async (_req, res) => {
  try {
    if (!isObsConnected()) return res.status(400).json({ error: "OBS not connected" });
    const scene = await getCurrentScene();
    res.json({ currentScene: scene });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/scene", async (req, res) => {
  try {
    const { scene } = req.body;
    await changeScene(scene);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/source/toggle", async (req, res) => {
  try {
    const { source } = req.body;
    const visible = await toggleSource(source);
    res.json({ visible });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
