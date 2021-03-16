module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      req.flash("error_msg", "Пожалуйста войдите");
      res.redirect("/login");
    }
  },
};
