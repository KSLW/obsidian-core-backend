import express from "express";
import crypto from "crypto";
import { emitEvent } from "../core/eventBus.js";

const router = express.Router();

// Verify the HMAC signature from Twitch
function verifyTwitchSignature(req) {
  const messageId = req.header("Twitch-Eventsub-Message-Id");
  const timestamp = req.header("Twitch-Eventsub-Message-Timestamp");
  const signature = req.header("Twitch-Eventsub-Message-Signature");
  if (!messageId || !timestamp || !signature) return false;

  const body = JSON.stringify(req.body);
  const message = messageId + timestamp + body;

  const hmac = crypto.createHmac("sha256", process.env.TWITCH_EVENTSUB_SECRET);
  const computed = "sha256=" + hmac.update(message).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
}

router.post("/callback", express.json({ type: "*/*" }), (req, res) => {
  const msgType = req.header("Twitch-Eventsub-Message-Type");

  if (msgType === "webhook_callback_verification") {
    return res.status(200).send(req.body.challenge);
  }

  if (!verifyTwitchSignature(req)) {
    return res.status(403).send("Invalid signature");
  }

  if (msgType === "notification") {
    const sub = req.body.subscription?.type;
    const event = req.body.event;

    if (sub === "channel.channel_points_custom_reward_redemption.add") {
      // You can map broadcaster_user_id -> your streamerId if you store it
      emitEvent("global", "twitch.redemption", { redemption: event });
    }
  }

  return res.sendStatus(200);
});

export default router;
