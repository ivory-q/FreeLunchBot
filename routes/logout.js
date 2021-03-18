const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  req.logout();
  req.flash("success_msg", "Вы вышли");
  res.redirect("/login");
});

module.exports = router;
