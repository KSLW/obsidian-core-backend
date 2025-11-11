import mongoose from "mongoose";

const TwitchAuthSchema = new mongoose.Schema(
  {
    accessToken: String,
    refreshToken: String,
    scope: [String],
    obtainedAt: Number,
    expiresIn: Number,
  },
  { _id: false }
);

const BotSchema = new mongoose.Schema(
  {
    username: String,
    channel: String,
  },
  { _id: false }
);

const StreamerSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true, unique: true },  // twitch user id
    displayName: String,
    twitchUsername: String,

    twitchAuth: { type: TwitchAuthSchema, default: () => ({}) },
    twitchBot: { type: BotSchema, default: () => ({}) },

    // reserved for discord later
    discordAuth: { type: Object, default: null },
  },
  { timestamps: true }
);

StreamersStatics(StreamerSchema);

function StreamersStatics(schema) {
  schema.statics.updateOrCreateByOwner = async function (ownerId, update) {
    const existing = await this.findOne({ ownerId });
    if (existing) {
      await this.updateOne({ ownerId }, { $set: update });
      return this.findOne({ ownerId });
    }
    return this.create({ ownerId, ...update });
  };

  schema.statics.setTwitchAuth = async function (ownerId, auth, bot) {
    return this.updateOrCreateByOwner(ownerId, {
      twitchAuth: auth,
      twitchBot: bot,
      twitchUsername: bot?.username,
    });
  };
}

export const Streamer = mongoose.models.Streamer || mongoose.model("Streamer", StreamerSchema);
