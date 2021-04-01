const express = require("express");
const router = express.Router();
const passport = require("passport");

const Sub = require("../models/Sub");
const Log = require("../models/Log");

async function getLogs() {
  let logsGroups = await Log.aggregate([
    { $sort: { date: -1 } },
    {
      $group: {
        _id: "$dateTarget",
        date: { $max: "$date" },
        logs: {
          $push: {
            dateTarget: "$dateTarget",
            date: "$dateFormatted",
            time: "$time",
            msg: "$msg",
          },
        },
      },
    },
    { $sort: { date: -1 } },
  ]);

  return logsGroups;
}

router
  .route("/")
  .get(async (req, res) => {
    res.render("login", { logsGroups: await getLogs() });
  })
  // .post((req, res, next) => {
  //   passport.authenticate("local", {
  //     successRedirect: "/dashboard",
  //     failureRedirect: "/login",
  //     failureFlash: true,
  //   })(req, res, next);
  // });

module.exports = router;
