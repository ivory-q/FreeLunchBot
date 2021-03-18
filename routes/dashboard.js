const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const { GetBotState } = require("../functions");

router.get("/", ensureAuthenticated, async (req, res) => {
  let state = await GetBotState(req.user);
  res.render("dashboard", {
    name: req.user.name,
    btn_start: state,
  });
});

module.exports = router;
