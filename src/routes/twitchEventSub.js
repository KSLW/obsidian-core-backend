// backend/src/routes/twitchEventSub.js
import express from "express";
import crypto from "crypto";
import { emitEvent } from "../core/eventBus.js";

const router = express.Router();
const TWITCH_SECRET = process.env.TWITCH_EVENTSUB_SECRET;

/**
 * Verify Twitch's signature for webhook security
 */
function verifyTwitchSignature(req) {
  const messageId = req.header("Twitch-Eventsub-Message-Id");
  const timestamp = req.header("Twitch-Eventsub-Message-Timestamp");
  const signature = req.header("Twitch-Eventsub-Message-Signature");
  const body = JSON.stringify(req.body);

  const computed = crypto
    .createHmac("sha256", TWITCH_SECRET)
    .update(messageId + timestamp + body)
    .digest("hex");

  return `sha256=${computed}` === signature;
}

/**
 * Handle Twitch EventSub callbacks
 */
router.post("/callback", express.json(), (req, res) => {
  // Step 1: Verification challenge
  if (req.header("Twitch-Eventsub-Message-Type") === "webhook_callback_verification") {
    return res.status(200).send(req.body.challenge);
  }

  // Step 2: Validate signature
  if (!verifyTwitchSignature(req)) {
    console.warn("⚠️ Invalid Twitch EventSub signature");
    return res.status(403).send("Invalid signature");
  }

  const event = req.body.event;
  const type = req.body.subscription.type;

  console.log(`🎯 EventSub received: ${type}`);

  // Step 3: Route redemption events into EventBus
  if (type === "channel.channel_points_custom_reward_redemption.add") {
    emitEvent(event.broadcaster_user_id, "channelPointRedemption", {
      user: event.user_name,
      reward: event.reward.title,
      input: event.user_input,
      status: event.status,
    });
  }

  res.status(200).send("ok");
});

export default router;
