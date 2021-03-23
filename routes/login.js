const express = require("express");
const router = express.Router();
const passport = require("passport");

const Log = require("../models/Log");

async function getLogs() {
  const logsGroups = await Log.aggregate([
    {
      $group: {
        _id: "$dateTarget",
        count: { $sum: 1 },
        logs: {
          $push: {
            dateTarget: "$dateTarget",
            date: "$date",
            time: "$time",
            msg: "$msg",
          },
        },
      },
    },
  ]);

  return logsGroups;
}

router
  .route("/")
  .get(async (req, res) => {
    res.render("login", { logsGroups: await getLogs() });
  })
  .post((req, res, next) => {
    passport.authenticate("local", {
      successRedirect: "/dashboard",
      failureRedirect: "/login",
      failureFlash: true,
    })(req, res, next);
  });

module.exports = router;
