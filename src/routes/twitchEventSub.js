// src/routes/twitchEventSub.js
import express from "express";
import crypto from "crypto";
import { emitEvent } from "../core/eventBus.js";
import { logTwitchEvent } from "../core/logger.js";

const router = express.Router();

// Validate Twitch webhook signature
function verifyTwitchSignature(req) {
  const messageId = req.header("Twitch-Eventsub-Message-Id");
  const timestamp = req.header("Twitch-Eventsub-Message-Timestamp");
  const body = JSON.stringify(req.body);
  const message = messageId + timestamp + body;

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", process.env.TWITCH_EVENTSUB_SECRET)
      .update(message)
      .digest("hex");

  const receivedSignature = req.header("Twitch-Eventsub-Message-Signature");
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature || "", "utf-8")
  );
}

router.post("/callback", express.json(), async (req, res) => {
  try {
    // 1️⃣ Verify signature
    if (!verifyTwitchSignature(req)) {
      console.warn("⚠️ Invalid Twitch EventSub signature");
      return res.status(403).send("Forbidden");
    }

       const messageType = req.header("Twitch-Eventsub-Message-Type");
  const body = req.body;

  if (messageType === "webhook_callback_verification") {
    return res.status(200).send(body.challenge);
  }

  if (messageType === "notification") {
    const { subscription, event } = body;
    const type = subscription.type;

    // Map Twitch event to automation trigger
    switch (type) {
      case "channel.follow":
        emitEvent(event.broadcaster_user_id, "twitch.follow", event);
        break;
      case "channel.subscribe":
        emitEvent(event.broadcaster_user_id, "twitch.subscribe", event);
        break;
      case "channel.raid":
        emitEvent(event.to_broadcaster_user_id, "twitch.raid", event);
        break;
      case "channel.channel_points_custom_reward_redemption.add":
        emitEvent(event.broadcaster_user_id, "twitch.redemption", event);
        break;
      default:
        console.log(`📡 Unhandled EventSub type: ${type}`);
    }

    return res.status(200).send("OK");
  }

  res.status(200).end();
}catch (err) {
    console.error("❌ Twitch EventSub callback error:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
