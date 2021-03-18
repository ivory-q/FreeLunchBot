const express = require("express");
const router = express.Router();

router.get(
  "/",
  (req, res, next) => {
    if (req.isAuthenticated()) {
      res.redirect("/dashboard");
    } else {
      next();
    }
  },
  (req, res) => {
    res.redirect("/login");
  }
);

module.exports = router;
