// src/modules/twitch/eventSubHandler.js
import crypto from "crypto";
import { emitEvent } from "../../core/eventBus.js";
import { logTwitchEvent } from "../../core/logger.js";

/**
 * Verify Twitch EventSub signature
 */
function verifyTwitchSignature(req) {
  const messageId = req.headers["twitch-eventsub-message-id"];
  const timestamp = req.headers["twitch-eventsub-message-timestamp"];
  const signature = req.headers["twitch-eventsub-message-signature"];
  const secret = process.env.TWITCH_EVENTSUB_SECRET;

  if (!messageId || !timestamp || !signature) return false;

  const body = JSON.stringify(req.body);
  const message = messageId + timestamp + body;
  const computedHmac =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(message).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedHmac)
  );
}

/**
 * Handle incoming EventSub POST request
 */
export async function handleEventSub(req, res) {
  if (!verifyTwitchSignature(req)) {
    console.warn("⚠️ Invalid Twitch signature detected");
    return res.status(403).send("Invalid signature");
  }

  const messageType = req.headers["twitch-eventsub-message-type"];
  const { subscription, event } = req.body;

  // Initial challenge verification
  if (messageType === "webhook_callback_verification") {
    console.log("✅ Twitch webhook verified:", subscription.type);
    return res.status(200).send(req.body.challenge);
  }

  // Handle notification (e.g., channel point redemption)
  if (messageType === "notification") {
    const eventType = subscription?.type || "unknown";
    const streamerId = event?.broadcaster_user_id || "global";

    await logTwitchEvent("eventsub_notification", {
      type: eventType,
      broadcaster: event.broadcaster_user_name,
      event,
    });

    // Example: Channel Point redemption
    if (eventType === "channel.channel_points_custom_reward_redemption.add") {
      emitEvent(streamerId, "twitch.redemption", {
        user: event.user_name,
        reward: event.reward.title,
        input: event.user_input,
      });
      console.log(`🎁 Redemption: ${event.user_name} → ${event.reward.title}`);
    }

    return res.status(200).send("OK");
  }

  // Handle revoked or unknown
  if (messageType === "revocation") {
    console.warn("⚠️ EventSub subscription revoked:", subscription?.type);
    return res.status(200).send("Revoked");
  }

  return res.status(200).send("Unhandled");
}
