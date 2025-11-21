// backend/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth.routes");
const commandRoutes = require("./routes/commands.routes");
const eventsRoutes = require("./routes/events.routes");
const modulesRoutes = require("./routes/modules.routes");
const systemRoutes = require("./routes/system.routes");

const app = express();

app.use(cors({
  origin: [
    "https://dashboard-3let.onrender.com"
  ],
  credentials: true
}));
app.use(bodyParser.json());

// Mount all API route groups under /api
app.use("/api", authRoutes);
app.use("/api", commandRoutes);
app.use("/api", eventsRoutes);
app.use("/api", modulesRoutes);
app.use("/api", systemRoutes);

// Simple root ping
app.get("/", (req, res) => {
  res.send("Obsidian backend is running");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Obsidian backend listening on port ${PORT}`);
});
