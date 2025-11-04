import express from "express";
import { Streamer } from "../models/Streamer.js";
const router = express.Router();

router.get("/status", async (_req, res) => {
  const all = await Streamer.find({});
  if (!all?.length) return res.json({});
  const s = all.sort((a,b) => (b.updatedAt||0)-(a.updatedAt||0))[0];
  res.json({
    displayName: s.displayName,
    twitch: !!s.twitchAuth?.accessToken,
    discord: !!s.discordAuth?.accessToken,
    twitchBot: s.twitchBot || {}
  });
});

export default router;
