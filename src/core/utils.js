export const delay = (ms) => new Promise((r) => setTimeout(r, ms));
export const sanitizeText = (s = "") => s.toString().replace(/\s+/g, " ").trim();
