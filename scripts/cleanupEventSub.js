// backend/scripts/cleanupEventSubs.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function cleanupEventSubs() {
  try {
    const { data } = await axios.get("https://api.twitch.tv/helix/eventsub/subscriptions", {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${process.env.TWITCH_APP_ACCESS_TOKEN}`, // app token, not user
      },
    });

    console.log(`Found ${data.data.length} subscriptions:`);
    for (const sub of data.data) {
      console.log(`🧩 ${sub.type} → ${sub.transport.callback}`);
      // Uncomment to delete
      // await axios.delete(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${sub.id}`, {
      //   headers: {
      //     "Client-ID": process.env.TWITCH_CLIENT_ID,
      //     Authorization: `Bearer ${process.env.TWITCH_APP_ACCESS_TOKEN}`,
      //   },
      // });
    }
  } catch (err) {
    console.error("❌ Cleanup failed:", err.response?.data || err.message);
  }
}

cleanupEventSubs();
