// src/core/actions.js
import { sendTwitchMessage } from "../modules/twitch/index.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Executes a single action object.
 * @param {string} streamerId
 * @param {object} action { type, payload }
 * @param {object} context { vars: {...}, rawEvent: {...} }
 */
export async function runAction(streamerId, action, context = {}) {
  const { type, payload = {} } = action ?? {};
  switch (type) {
    case "sendTwitchMessage": {
      const text = interpolate(payload.text || "", context.vars);
      const channel = payload.channel; // optional override
      if (!text) return;
      await sendTwitchMessage(text, channel);
      return;
    }

    case "obsSceneSwitch": {
      if (!payload.scene) return;
      await changeScene(payload.scene);
      return;
    }

    case "obsToggleSource": {
      if (!payload.source) return;
      await toggleSource(payload.source);
      return;
    }

    case "obsToggleMute": {
      if (!payload.input) return;
      await toggleMute(payload.input);
      return;
    }

    case "delay": {
      const ms = Number(payload.ms || 0);
      if (ms > 0) await sleep(ms);
      return;
    }

    default:
      console.warn(`⚠️ Unknown action type: ${type}`);
  }
}

/**
 * Executes a sequence of actions.
 */
export async function runActions(streamerId, actions = [], context = {}) {
  for (const a of actions) {
    // fail-safe: do not block the chain forever
    try {
      // eslint-disable-next-line no-await-in-loop
      await runAction(streamerId, a, context);
    } catch (e) {
      console.error("Action failed:", a?.type, e.message);
    }
  }
}

/** Very small template helper for {username}, {message}, etc. */
function interpolate(text, vars = {}) {
  return String(text).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}
