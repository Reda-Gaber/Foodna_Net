const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const isAuth = require("../middleware/auth.middleware");

router.get("/register", (req, res) => res.render("user/register", { error: null, success: req.query.success }));
router.get("/emailisexist", authController.emailIsExists);

router.post("/register", authController.createAccount);
router.post("/login", authController.login);

router.get("/home", isAuth, authController.getHome);

router.get("/logout", isAuth, authController.logout);

module.exports = router;
