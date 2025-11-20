module.exports = {
  id: "example",
  name: "Example Module",
  description: "This is a sample module to demonstrate the module system.",
  
  onLoad() {
    console.log("[MODULE] Example Module loaded");
  },

  onMessage({ client, channel, tags, message }) {
    // Future message logic for this module
  },

  onEvent(type, payload) {
    // Future event logic for this module
  },

  onShutdown() {
    console.log("[MODULE] Example Module shutting down...");
  }
};
