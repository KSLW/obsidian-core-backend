// src/modules/twitch/eventsub.js
import axios from "axios";
import { EventSub } from "../../models/EventSub.js";
import { getAppAccessToken } from "./auth.js";

/**
 * Helper to create or verify an EventSub subscription
 */
export async function ensureEventSubSubscription(broadcasterId, type, condition = {}) {
  const appToken = await getAppAccessToken();
  const callback = `${process.env.BACKEND_URL}/api/twitch/eventsub/callback`;

  try {
    // Check if already exists
    const existing = await EventSub.findOne({ broadcasterId, type });
    if (existing) return existing;

    // Create new subscription
    const res = await axios.post(
      "https://api.twitch.tv/helix/eventsub/subscriptions",
      {
        type,
        version: "1",
        condition,
        transport: {
          method: "webhook",
          callback,
          secret: process.env.TWITCH_EVENTSUB_SECRET,
        },
      },
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${appToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const sub = res.data.data?.[0];
    if (sub) {
      await EventSub.create({
        broadcasterId,
        type,
        status: sub.status,
        subscriptionId: sub.id,
        createdAt: new Date(),
      });
      console.log(`✅ EventSub registered: ${type}`);
      return sub;
    }

    throw new Error("No subscription returned from Twitch API");
  } catch (err) {
    console.error(`❌ Failed to register EventSub [${type}]`, err.response?.data || err.message);
    throw err;
  }
}

/**
 * Bootstraps all essential EventSub subscriptions for a streamer
 */
export async function registerAllEventSubsForStreamer(broadcasterId) {
  const commonSubs = [
    {
      type: "channel.follow",
      condition: { broadcaster_user_id: broadcasterId },
    },
    {
      type: "channel.subscribe",
      condition: { broadcaster_user_id: broadcasterId },
    },
    {
      type: "channel.raid",
      condition: { to_broadcaster_user_id: broadcasterId },
    },
    {
      type: "channel.channel_points_custom_reward_redemption.add",
      condition: { broadcaster_user_id: broadcasterId },
    },
  ];

  for (const sub of commonSubs) {
    await ensureEventSubSubscription(broadcasterId, sub.type, sub.condition);
  }

  console.log(`🎯 EventSubs ensured for broadcaster ${broadcasterId}`);
}

/**
 * Clean up orphaned subscriptions (optional maintenance)
 */
export async function cleanupStaleEventSubs() {
  try {
    const appToken = await getAppAccessToken();

    const res = await axios.get("https://api.twitch.tv/helix/eventsub/subscriptions", {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${appToken}`,
      },
    });

    const all = res.data.data || [];
    const activeIds = all.map((s) => s.id);

    await EventSub.deleteMany({ subscriptionId: { $nin: activeIds } });
    console.log(`🧹 Cleaned up stale EventSubs (remaining: ${all.length})`);
  } catch (err) {
    console.warn("⚠️ Failed to clean up EventSubs:", err.response?.data || err.message);
  }
}
