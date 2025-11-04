// backend/src/engine/actions.js
/**
 * Unified action runner used by commands & automations.
 * Supported actions:
 * - send_message      { platform: "twitch"|"discord"|"both", message }
 * - obs_action        { type: "change_scene"|"toggle_source"|"toggle_mute"|... , ... }
 * - api_call          { method, url, headers, body }
 * - delay             { ms }
 * - give_role         { role }
 * - remove_role       { role }
 */

import axios from "axios";
import { sendTwitchMessage } from "../modules/twitch/index.js";
import { sendDiscordMessage, giveRoleToUser, removeRoleFromUser } from "../modules/discord/index.js";
import { runObsAction } from "../modules/obs/index.js";

function interpolate(template = "", ctx = {}) {
  return (template || "")
    .replaceAll("{user}", ctx.username || "")
    .replaceAll("{username}", ctx.username || "")
    .replaceAll("{channel}", ctx.channel || "")
    .replaceAll("{platform}", ctx.platform || "");
}

export async function runAction(ctx, action) {
  const { type, params = {} } = action || {};

  switch (type) {
    case "send_message": {
      const txt = interpolate(params.message, ctx);
      if (!txt) return;

      if (params.platform === "twitch") {
        await (ctx.sayTwitch ? ctx.sayTwitch(txt) : sendTwitchMessage(txt));
      } else if (params.platform === "discord") {
        await (ctx.sayDiscord ? ctx.sayDiscord(txt) : sendDiscordMessage(ctx, txt));
      } else {
        // both / fallback
        if (ctx.sayTwitch) await ctx.sayTwitch(txt);
        if (ctx.sayDiscord) await ctx.sayDiscord(txt);
      }
      return;
    }

    case "obs_action": {
      // Example params:
      // { type: "change_scene", scene: "BRB" }
      // { type: "toggle_source", source: "Webcam" }
      // { type: "toggle_mute", input: "Mic/Aux" }
      await runObsAction(params.type, params);
      return;
    }

    case "api_call": {
      const method = (params.method || "GET").toUpperCase();
      const url = interpolate(params.url, ctx);
      const headers = params.headers || {};
      const data = params.body || undefined;
      await axios({ method, url, headers, data });
      return;
    }

    case "delay": {
      const ms = Number(params.ms || 0);
      if (ms > 0) await new Promise((r) => setTimeout(r, ms));
      return;
    }

    case "give_role": {
      if (!ctx.guild || !ctx.member) return;
      const role = params.role;
      if (!role) return;
      await giveRoleToUser(ctx.guild, ctx.member.id, role);
      return;
    }

    case "remove_role": {
      if (!ctx.guild || !ctx.member) return;
      const role = params.role;
      if (!role) return;
      await removeRoleFromUser(ctx.guild, ctx.member.id, role);
      return;
    }

    default:
      console.warn("⚠️ Unknown action type:", type);
      return;
  }
}

export async function runActions(ctx, actions = []) {
  for (const a of actions) {
    try {
      // support optional per-action delay before
      if (a.beforeDelayMs) {
        await new Promise((r) => setTimeout(r, Number(a.beforeDelayMs)));
      }
      await runAction(ctx, a);
      if (a.afterDelayMs) {
        await new Promise((r) => setTimeout(r, Number(a.afterDelayMs)));
      }
    } catch (err) {
      console.error("❌ Action error:", err.message || err);
    }
  }
}
