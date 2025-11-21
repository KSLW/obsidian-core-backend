module.exports = {
  id: "logger",
  name: "Logger",
  description: "Logs all messages and events.",
  enabled: true,

  onLoad() {
    console.log("🟠 Logger module loaded");
  },

  onMessage({ message, tags }) {
    console.log(`[MSG] ${tags["display-name"]}: ${message}`);
  },

  onEvent(type, payload) {
    console.log(`[EVENT HOOK] ${type}`, payload);
  }
};
