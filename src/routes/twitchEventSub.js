// src/routes/twitchEventSub.js
import express from "express";
import { handleEventSub } from "../modules/twitch/eventSubHandler.js";

const router = express.Router();

// Twitch sends raw JSON, so we need the body before express.json() mangles it
router.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

router.post("/callback", handleEventSub);

export default router;
