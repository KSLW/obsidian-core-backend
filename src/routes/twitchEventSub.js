import express from "express";
import crypto from "crypto";
import { emitEvent } from "../core/eventBus.js";
import { logTwitchEvent } from "../core/logger.js";

const router = express.Router();

/* Twitch Webhook challenge (verification) + event intake */
router.post("/callback", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    // verify signature
    const msgId = req.header("Twitch-Eventsub-Message-Id");
    const timestamp = req.header("Twitch-Eventsub-Message-Timestamp");
    const signature = req.header("Twitch-Eventsub-Message-Signature");
    const hmacMessage = msgId + timestamp + req.body.toString();
    const hmac = crypto
      .createHmac("sha256", process.env.TWITCH_EVENTSUB_SECRET)
      .update(hmacMessage)
      .digest("hex");
    const expected = `sha256=${hmac}`;
    if (signature !== expected) {
      return res.status(403).send("Invalid signature");
    }

    const json = JSON.parse(req.body.toString());

    // challenge handshake
    if (req.header("Twitch-Eventsub-Message-Type") === "webhook_callback_verification") {
      return res.status(200).send(json.challenge);
    }

    // revocation
    if (req.header("Twitch-Eventsub-Message-Type") === "revocation") {
      await logTwitchEvent("eventsub_revoked", { subscription: json.subscription });
      return res.status(200).end();
    }

    // dispatch redemption
    if (json?.subscription?.type === "channel.channel_points_custom_reward_redemption.add") {
      const e = json.event;
      const payload = {
        streamerId: "global",
        user: e.user_name,
        rewardTitle: e.reward?.title || e.reward?.id || "redemption",
        input: e.user_input || "",
        raw: e,
      };
      await logTwitchEvent("redemption", payload);
      emitEvent(payload.streamerId, "twitch.redemption", payload);
    }

    res.status(200).end();
  } catch (e) {
    console.error("EventSub error:", e.message);
    res.status(500).end();
  }
});

export default router;
