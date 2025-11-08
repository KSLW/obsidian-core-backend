// backend/src/routes/twitchEventSub.js
import express from "express";
import crypto from "crypto";
import { emitEvent } from "../core/eventBus.js";
import { runAutomations } from "../engine/automations.js";
import { logTwitchEvent } from "../core/logger.js";

export const router = express.Router();

/**
 * Verify Twitch HMAC Signature
 */
function verifyTwitchSignature(req) {
  const messageId = req.headers["twitch-eventsub-message-id"];
  const timestamp = req.headers["twitch-eventsub-message-timestamp"];
  const signature = req.headers["twitch-eventsub-message-signature"];
  const secret = process.env.TWITCH_EVENTSUB_SECRET;

  if (!messageId || !timestamp || !signature) return false;

  const computedHmac = crypto
    .createHmac("sha256", secret)
    .update(messageId + timestamp + JSON.stringify(req.body))
    .digest("hex");

  return `sha256=${computedHmac}` === signature;
}

/**
 * EventSub callback endpoint
 */
router.post("/callback", express.json(), async (req, res) => {
  // Verify Twitch signature
  if (!verifyTwitchSignature(req)) {
    console.warn("⚠️ Invalid Twitch EventSub signature");
    return res.status(403).send("Invalid signature");
  }

  const messageType = req.headers["twitch-eventsub-message-type"];
  const event = req.body.event;

  // ✅ Handle verification challenge
  if (messageType === "webhook_callback_verification") {
    console.log("✅ EventSub verified by Twitch");
    return res.status(200).send(req.body.challenge);
  }

  // ✅ Handle notification event
  if (messageType === "notification") {
    if (req.body.subscription.type === "channel.channel_points_custom_reward_redemption.add") {
      console.log(`🎁 Redemption received: ${event.user_name} redeemed "${event.reward.title}"`);
      
      // Log it
      await logTwitchEvent({
        type: "redemption",
        user: event.user_name,
        channel: event.broadcaster_user_name,
        meta: {
          reward: event.reward.title,
          cost: event.reward.cost,
          input: event.user_input,
        },
      });

      // Emit to internal systems
      emitEvent(event.broadcaster_user_id, "twitchRedemption", event);

      // Run any linked automations
      await runAutomations("twitchRedemption", event);
    }
    return res.status(200).send("OK");
  }

  // ✅ Handle revoked subscriptions
  if (messageType === "revocation") {
    console.warn(`⚠️ EventSub subscription revoked: ${req.body.subscription.id}`);
    return res.status(204).send();
  }

  return res.status(200).send("Unhandled event");
});
