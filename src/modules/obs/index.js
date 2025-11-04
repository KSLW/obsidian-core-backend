import OBSWebSocket from "obs-websocket-js";
import dotenv from "dotenv";
import { emitEvent } from "../../core/eventBus.js";
dotenv.config({ path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.local"});

let obs = new OBSWebSocket();
let connected = false;

export async function initOBS() {
  const url = process.env.OBS_URL || "ws://127.0.0.1:4455";
  const password = process.env.OBS_PASSWORD || "";
  try {
    await obs.connect(url, password);
    connected = true;
    console.log("🎥 Connected to OBS WebSocket");

    registerObsEvents();
  } catch (err) {
    connected = false;
    console.warn("⚠️ OBS connection failed:", err.message);
  }
}

function registerObsEvents() {
  obs.on("CurrentProgramSceneChanged", (data) => {
    emitEvent("global", "sceneChanged", { scene: data.sceneName });
  });

  obs.on("SceneItemEnableStateChanged", (data) => {
    emitEvent("global", "sourceToggled", {
      sceneName: data.sceneName,
      sourceName: data.sceneItemName,
      enabled: data.sceneItemEnabled,
    });
  });

  obs.on("ExitStarted", () => { connected = false; });
  obs.on("ConnectionClosed", () => { connected = false; });
}

export function isObsConnected() { return connected; }

export async function listScenes() {
  if (!connected) throw new Error("OBS not connected");
  const { scenes } = await obs.call("GetSceneList");
  return scenes.map((s) => s.sceneName);
}

export async function getCurrentScene() {
  if (!connected) throw new Error("OBS not connected");
  const { currentProgramSceneName } = await obs.call("GetCurrentProgramScene");
  return currentProgramSceneName;
}

export async function changeScene(sceneName) {
  if (!connected) throw new Error("OBS not connected");
  await obs.call("SetCurrentProgramScene", { sceneName });
  emitEvent("global", "sceneChanged", { scene: sceneName });
  console.log(`🎬 Switched to scene: ${sceneName}`);
}

export async function toggleMute(inputName) {
  if (!connected) throw new Error("OBS not connected");
  const { inputMuted } = await obs.call("GetInputMute", { inputName });
  await obs.call("SetInputMute", { inputName, inputMuted: !inputMuted });
  emitEvent("global", "muteChanged", { inputName, muted: !inputMuted });
  return !inputMuted;
}

export async function toggleSource(sourceName) {
  if (!connected) throw new Error("OBS not connected");

  const { currentProgramSceneName } = await obs.call("GetCurrentProgramScene");
  const { sceneItems } = await obs.call("GetSceneItemList", { sceneName: currentProgramSceneName });

  const target = sceneItems.find((i) => i.sourceName === sourceName);
  if (!target) throw new Error(`Source "${sourceName}" not found in scene ${currentProgramSceneName}`);

  const newState = !target.sceneItemEnabled;
  await obs.call("SetSceneItemEnabled", {
    sceneName: currentProgramSceneName,
    sceneItemId: target.sceneItemId,
    sceneItemEnabled: newState,
  });

  emitEvent("global", "sourceToggled", { scene: currentProgramSceneName, source: sourceName, visible: newState });
  return newState;
}

export async function runObsAction(type, params = {}) {
  switch (type) {
    case "change_scene": return changeScene(params.scene);
    case "toggle_source": return toggleSource(params.source);
    case "toggle_mute": return toggleMute(params.input);
    default: console.warn(`⚠️ Unknown OBS action type: ${type}`);
  }
}
