const express = require("express");
const router = express.Router();
const passport = require("passport");

router
  .route("/")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res, next) => {
    passport.authenticate("local", {
      successRedirect: "/dashboard",
      failureRedirect: "/login",
      failureFlash: true,
    })(req, res, next);
  });

module.exports = router;
