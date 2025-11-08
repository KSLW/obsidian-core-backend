import OBSWebSocket from "obs-websocket-js";
import dotenv from "dotenv";
import { emitEvent } from "../../core/eventBus.js";
import { logOBSEvent } from "../../core/logger.js";

dotenv.config();

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
  obs.on("CurrentProgramSceneChanged", (d) => {
    emitEvent("global", "sceneChanged", { scene: d.sceneName });
    logOBSEvent({ type: "sceneChanged", meta: { scene: d.sceneName } });
  });
  obs.on("InputMuteStateChanged", (d) => {
    emitEvent("global", "muteChanged", { inputName: d.inputName, muted: d.inputMuted });
  });
  obs.on("ExitStarted", () => { connected = false; });
  obs.on("ConnectionClosed", () => { connected = false; });
}

/* Scenes */
export async function listScenes() {
  if (!connected) throw new Error("OBS not connected");
  const { scenes } = await obs.call("GetSceneList");
  return scenes.map(s => s.sceneName);
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
}

/* Sources / Audio */
export async function toggleSource(sourceName) {
  if (!connected) throw new Error("OBS not connected");
  const { currentProgramSceneName } = await obs.call("GetCurrentProgramScene");
  const { sceneItems } = await obs.call("GetSceneItemList", { sceneName: currentProgramSceneName });
  const target = sceneItems.find(i => i.sourceName === sourceName);
  if (!target) throw new Error(`Source '${sourceName}' not found in scene '${currentProgramSceneName}'`);
  const newEnabled = !target.sceneItemEnabled;
  await obs.call("SetSceneItemEnabled", { sceneName: currentProgramSceneName, sceneItemId: target.sceneItemId, sceneItemEnabled: newEnabled });
  emitEvent("global", "sourceToggled", { scene: currentProgramSceneName, source: sourceName, visible: newEnabled });
  return newEnabled;
}

export async function toggleMute(inputName) {
  if (!connected) throw new Error("OBS not connected");
  const { inputMuted } = await obs.call("GetInputMute", { inputName });
  await obs.call("SetInputMute", { inputName, inputMuted: !inputMuted });
  emitEvent("global", "muteChanged", { inputName, muted: !inputMuted });
  return !inputMuted;
}
export async function setMute(inputName, mute = true) {
  if (!connected) throw new Error("OBS not connected");
  await obs.call("SetInputMute", { inputName, inputMuted: mute });
  emitEvent("global", "muteChanged", { inputName, muted: mute });
}
export async function toggleStream() {
  if (!connected) throw new Error("OBS not connected");
  const { outputActive } = await obs.call("GetStreamStatus");
  await obs.call(outputActive ? "StopStream" : "StartStream");
  emitEvent("global", "streamState", { active: !outputActive });
}

export function isOBSConnected() { return connected; }

export { obs };
