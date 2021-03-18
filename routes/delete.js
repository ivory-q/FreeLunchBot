const express = require("express");
const router = express.Router();
const { GetBotState } = require("../functions");

const User = require("../models/User");
const Sub = require("../models/Sub");

router.get("/", async (req, res) => {
    if (!(await GetBotState(req.user))) {
      Sub.deleteOne({ username: req.user.username }).catch((err) => {
        console.log(err);
      });
    }
    User.deleteOne({ username: req.user.username }).catch((err) =>
      console.log(err)
    );
    req.logout();
    req.flash("success_msg", "Аккаунт успешно удален");
    res.redirect("/login");
  });

module.exports = router;
