const express = require("express");
const router = express.Router();

router.post("/webhook", async (req, res) => {
  console.log("🔥 PAYOS WEBHOOK:", req.body);

  return res.status(200).json({
    error: 0,
    message: "ok",
    data: null,
  });
});

module.exports = router;