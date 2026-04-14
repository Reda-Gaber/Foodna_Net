const router = require("express").Router();
const isAuthenticated = require("../../core/middlewares/isAuth");

router.get("/", isAuthenticated, (req, res) => {
  if (req.session.user.role !== "Cashier") {
    return res.redirect("/dashboard");
  }
  res.render("cashier/index", { user: req.session.user });
});

module.exports = router;