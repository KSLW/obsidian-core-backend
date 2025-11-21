import { getSettings } from "../../../";

async function twitchLogin(req, res) {
  try {
    const settings = await getSettings();
    const clientId = process.env.TWITCH_CLIENT_ID;

    if (!clientId) {
      return res
        .status(400)
        .send("Twitch Client ID not set.");
    }

    const redirectUri = process.env.TWITCH_REDIRECT_URI;
    const scope = [
      "user:read:email",
      "chat:read",
      "chat:edit"
    ].join(" ");

    const authUrl = new URL("https://id.twitch.tv/oauth2/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scope);

    return res.redirect(authUrl.toString());
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Failed to start Twitch OAuth");
  }
}
