// backend/src/routes/twitchEventSub.js
import express from "express";
import crypto from "crypto";
import { emitEvent } from "../core/eventBus.js";

const router = express.Router();

/**
 * Verify the EventSub message signature
 */
function verifyTwitchSignature(req) {
  const messageId = req.header("Twitch-Eventsub-Message-Id");
  const timestamp = req.header("Twitch-Eventsub-Message-Timestamp");
  const signature = req.header("Twitch-Eventsub-Message-Signature");

  if (!messageId || !timestamp || !signature) return false;

  const secret = process.env.TWITCH_EVENTSUB_SECRET;
  const body = JSON.stringify(req.body);
  const message = messageId + timestamp + body;

  const computed = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  return `sha256=${computed}` === signature;
}

/**
 * Handle Twitch EventSub webhook callback
 */
router.post("/callback", express.json({ verify: (req, res, buf) => (req.rawBody = buf.toString()) }), async (req, res) => {
  try {
    if (!verifyTwitchSignature(req)) {
      console.warn("⚠️ Invalid Twitch signature — rejecting EventSub message.");
      return res.status(403).send("Invalid signature");
    }

    const messageType = req.header("Twitch-Eventsub-Message-Type");

    // Step 1 — Twitch verification challenge
    if (messageType === "webhook_callback_verification") {
      console.log("✅ EventSub challenge verified.");
      return res.status(200).send(req.body.challenge);
    }

    // Step 2 — Actual event
    if (messageType === "notification") {
      const event = req.body.event;

      console.log("🎁 EventSub notification received:", event.type || "channel_points_redemption");

      if (event.reward?.title) {
        // Handle channel point redemption
        emitEvent(event.broadcaster_user_id, "twitchRedemption", {
          user: event.user_name,
          reward: event.reward.title,
          cost: event.reward.cost,
          input: event.user_input,
        });
      } else {
        // Future-proof: emit all other events too
        emitEvent(event.broadcaster_user_id, "twitchEvent", event);
      }

      return res.status(200).send("OK");
    }

    // Step 3 — Subscription revocation
    if (messageType === "revocation") {
      console.warn("⚠️ Twitch EventSub subscription revoked:", req.body.subscription);
      return res.status(200).send("Revoked");
    }

    res.status(200).send("Ignored");
  } catch (err) {
    console.error("❌ EventSub callback error:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
