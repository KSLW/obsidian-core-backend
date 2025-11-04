// backend/src/engine/commands.js
/**
 * Command engine:
 * - Parses chat messages (e.g., "!hydrate")
 * - Looks up command in Registry
 * - Enforces cooldowns/permissions
 * - Sends response + runs actions
 */

import { Registry } from "../core/registry.js";
import { runActions } from "./actions.js";

const GLOBAL_PREFIX = "!"; // could be per-streamer later
// cooldown memory: key -> lastUsedTs
// key pattern: `${streamerId}:${commandName.toLowerCase()}`
const cooldowns = new Map();

function now() {
  return Date.now();
}

function hasCooldown(streamerId, cmd) {
  const key = `${streamerId}:${cmd.name.toLowerCase()}`;
  const last = cooldowns.get(key) || 0;
  const cdMs = (cmd.cooldown || 0) * 1000;
  return cdMs > 0 && now() - last < cdMs;
}

function setCooldown(streamerId, cmd) {
  const key = `${streamerId}:${cmd.name.toLowerCase()}`;
  cooldowns.set(key, now());
}

function checkPermissions(cmd, ctx) {
  // cmd.permissions: ["everyone"] | ["mod"] | ["owner"] | ["sub"]
  const perms = cmd.permissions || ["everyone"];
  if (perms.includes("everyone")) return true;
  if (perms.includes("mod") && ctx.isMod) return true;
  if (perms.includes("owner") && ctx.isOwner) return true;
  if (perms.includes("sub") && ctx.isSub) return true;
  return false;
}

function interpolate(template = "", ctx = {}) {
  return (template || "")
    .replaceAll("{user}", ctx.username || "")
    .replaceAll("{username}", ctx.username || "")
    .replaceAll("{channel}", ctx.channel || "")
    .replaceAll("{platform}", ctx.platform || "");
}

/**
 * Handle a single incoming chat line (Twitch or Discord)
 * ctx: {
 *   streamerId, platform, message, username, isMod, isSub, isOwner,
 *   sayTwitch, sayDiscord, sayPlatform
 * }
 */
export async function handleIncomingChat(ctx) {
  const msg = (ctx.message || "").trim();
  if (!msg.startsWith(GLOBAL_PREFIX)) return false;

  // parse command name + args
  const [rawName, ...args] = msg.slice(GLOBAL_PREFIX.length).split(/\s+/);
  const name = `${GLOBAL_PREFIX}${rawName.toLowerCase()}`;

  const cmd = Registry.getCommand(ctx.streamerId, name);
  if (!cmd || cmd.enabled === false) return false;

  // permissions
  if (!checkPermissions(cmd, ctx)) {
    // optional: silently ignore
    return true;
  }

  // cooldown
  if (hasCooldown(ctx.streamerId, cmd)) {
    // optional: send cooldown message
    return true;
  }

  // response
  if (cmd.response) {
    const text = interpolate(cmd.response, ctx);
    if (ctx.platform === "twitch") {
      await ctx.sayTwitch?.(text);
    } else if (ctx.platform === "discord") {
      await ctx.sayDiscord?.(text);
    } else {
      await ctx.sayPlatform?.(text);
    }
  }

  // actions
  if (Array.isArray(cmd.actions) && cmd.actions.length > 0) {
    const extendedCtx = { ...ctx, args };
    await runActions(extendedCtx, cmd.actions);
  }

  setCooldown(ctx.streamerId, cmd);
  return true;
}
