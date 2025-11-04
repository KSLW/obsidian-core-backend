import { sendTwitchMessage, timeoutUser } from "../modules/twitch/index.js";
import { changeScene, toggleSource, toggleMute, setMute, toggleStream } from "../modules/obs/index.js";
// (Discord actions can be added later)

export async function runAction(streamerId, type, params = {}, ctx = {}) {
  switch (type) {
    /* Twitch */
    case "twitch.send_message":
      return sendTwitchMessage(params.message, params.channel);
    case "twitch.timeout_user":
      return timeoutUser(params.username, params.seconds || 600, params.reason || "Rule violation");

    /* OBS */
    case "obs.change_scene":     return changeScene(params.scene);
    case "obs.toggle_source":    return toggleSource(params.source);
    case "obs.toggle_mute":      return toggleMute(params.input);
    case "obs.set_mute":         return setMute(params.input, params.state === true);
    case "obs.toggle_stream":    return toggleStream();

    default:
      console.warn(`⚠️ Unknown action type: ${type}`);
  }
}
