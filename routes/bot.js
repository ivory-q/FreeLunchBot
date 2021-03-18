const express = require("express");
const router = express.Router();
const { ChangeBotState } = require("../functions");

router.post("/", async (req, res) => {
    await ChangeBotState(req.user);
    res.redirect("/dashboard");
  });

module.exports = router;
