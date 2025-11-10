// src/modules/obs/index.js
import OBSWebSocket from "obs-websocket-js";
import { emitEvent, subscribeEvent } from "../../core/eventBus.js";

let obs = null;
let connected = false;

export async function initOBS() {
  const OBS_URL = process.env.OBS_URL || "ws://127.0.0.1:4455";
  const OBS_PASSWORD = process.env.OBS_PASSWORD || "";

  obs = new OBSWebSocket();

  try {
    await obs.connect(OBS_URL, OBS_PASSWORD);
    connected = true;
    console.log(`🎥 Connected to OBS WebSocket at ${OBS_URL}`);

    emitEvent("global", "obs.connected", { url: OBS_URL });

    // Listen for connection loss
    obs.on("ConnectionClosed", () => {
      connected = false;
      console.warn("⚠️ OBS connection closed. Reconnecting in 5s...");
      setTimeout(initOBS, 5000);
    });

    // Listen for Scene changes
    obs.on("CurrentProgramSceneChanged", (data) => {
      emitEvent("global", "obs.scene.changed", data);
      console.log(`🎬 Scene changed → ${data.sceneName}`);
    });

    return true;
  } catch (err) {
    console.warn(`⚠️ OBS connection failed: ${err.message}`);
    connected = false;
    return false;
  }
}

export function isOBSConnected() {
  return connected;
}

export async function switchScene(sceneName) {
  if (!connected) throw new Error("OBS not connected");
  await obs.call("SetCurrentProgramScene", { sceneName });
  console.log(`🎬 OBS scene switched to → ${sceneName}`);
}

export async function toggleSourceVisibility(sceneName, sourceName, visible) {
  if (!connected) throw new Error("OBS not connected");
  await obs.call("SetSceneItemEnabled", {
    sceneName,
    sceneItemId: await getSceneItemId(sceneName, sourceName),
    sceneItemEnabled: visible,
  });
  console.log(`👁️ ${sourceName} in ${sceneName} set to ${visible}`);
}

async function getSceneItemId(sceneName, sourceName) {
  const items = await obs.call("GetSceneItemList", { sceneName });
  const found = items.sceneItems.find((i) => i.sourceName === sourceName);
  if (!found) throw new Error(`Source "${sourceName}" not found in scene "${sceneName}"`);
  return found.sceneItemId;
}
