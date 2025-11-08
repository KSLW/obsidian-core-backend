// src/routes/twitchEventSub.js
import express from "express";
import crypto from "crypto";
import { emitEvent } from "../core/eventBus.js";
import { logTwitchEvent } from "../core/logger.js";

const router = express.Router();

// raw body middleware for signature check
router.use("/callback", express.raw({ type: "*/*" }));

router.post("/callback", async (req, res) => {
  const messageId = req.header("Twitch-Eventsub-Message-Id") || "";
  const timestamp = req.header("Twitch-Eventsub-Message-Timestamp") || "";
  const signature = req.header("Twitch-Eventsub-Message-Signature") || "";
  const type = req.header("Twitch-Eventsub-Message-Type") || "";

  const secret = process.env.TWITCH_EVENTSUB_SECRET;
  if (!secret) return res.status(500).send("Missing secret");

  const hmacMessage = messageId + timestamp + req.body.toString("utf8");
  const hmac = crypto.createHmac("sha256", secret).update(hmacMessage).digest("hex");
  const expected = `sha256=${hmac}`;

  if (signature !== expected) {
    console.warn("⚠️ Invalid signature for EventSub");
    return res.status(403).send("Invalid signature");
  }

  const body = JSON.parse(req.body.toString("utf8"));

  // Challenge handshake
  if (type === "webhook_callback_verification") {
    return res.status(200).send(body.challenge);
  }

  // Notification
  if (type === "notification") {
    const { subscription, event } = body;

    if (subscription?.type === "channel.channel_points_custom_reward_redemption.add") {
      const data = {
        reward: event.reward?.title,
        user: event.user_name,
        userId: event.user_id,
        input: event.user_input,
        status: event.status,
      };

      await logTwitchEvent("redemption", data);
      emitEvent(streamerId, "twitch.redemption", {
      user: body.event.user_name,
      reward: body.event.reward.title,
      cost: body.event.reward.cost,
      raw: body.event,
});
    }

    return res.status(200).send("OK");
  }

  return res.status(200).send("OK");
});

export default router;
