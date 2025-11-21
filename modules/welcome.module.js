const greeted = new Set();

module.exports = {
  id: "welcome",
  name: "Welcome",
  description: "Greets users when they chat for the first time.",
  enabled: true,

  onLoad() {
    greeted.clear();
  },

  onMessage({ client, channel, tags }) {
    const user = tags["display-name"];
    if (!greeted.has(user)) {
      greeted.add(user);
      client.say(channel, `Welcome to the stream, ${user}! 👋`);
    }
  }
};
