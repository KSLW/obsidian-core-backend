import express from "express";
import { Streamer } from "../models/Streamer.js";
const router = express.Router();

router.get("/status", async (_req, res) => {
  const list = await Streamer.find({});
  const latest = list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
  if (!latest) return res.json({ twitch: false, discord: false });

  res.json({
    displayName: latest.displayName,
    twitch: !!latest.twitchAuth?.accessToken,
    discord: !!latest.discordAuth?.accessToken,
    twitchBot: latest.twitchBot || null,
  });
});

export default router;
