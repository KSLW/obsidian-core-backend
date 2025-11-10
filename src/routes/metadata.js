// src/routes/metadata.js
import express from "express";
import { AUTOMATION_ENUMS } from "../models/Automation.js";

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({
    triggerTypes: AUTOMATION_ENUMS.VALID_TRIGGER_TYPES,
    actionTypes: AUTOMATION_ENUMS.VALID_ACTION_TYPES,
    permissions: ["everyone", "subscribers", "mods", "owner"],
  });
});

export default router;
