const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");
const isAuth = require("./auth.middleware");

router.get("/register", (req, res) => {
  res.render("auth/customer-register", { error: null, success: req.query.success, next: req.query.next || '' });
});
router.get("/emailisexist", authController.emailIsExists);

router.post("/register", authController.createAccount);
router.post("/login",    authController.login);

router.get("/",      isAuth, authController.get);
router.get("/logout", isAuth, authController.logout);

// مسارات تحديث الملف الشخصي (تتطلب تسجيل الدخول)
router.put("/api/update",          isAuth, authController.updateProfile);
router.post("/api/update",         isAuth, authController.updateProfile);   // دعم multipart fallback
router.put("/api/update-password", isAuth, authController.updatePassword);

module.exports = router;