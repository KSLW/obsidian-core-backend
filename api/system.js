const router = require("express").Router();

router.post("/restart", (req, res) => {
  console.log("🔄 Restart requested via API");
  res.json({ ok: true });

  setTimeout(() => {
    process.exit(1);
  }, 300);
});

module.exports = router;
