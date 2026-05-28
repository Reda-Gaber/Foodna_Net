const express = require("express");
const router = express.Router();
const db = require("../../config/db");

const authController = require("./auth.controller");
const isAuth = require("./auth.middleware");

router.get("/register", (req, res) => {
  res.render("auth/customer-register", { error: null, success: req.query.success, next: req.query.next || '' });
});
router.get("/emailisexist", authController.emailIsExists);

router.post("/register", authController.createAccount);
router.post("/login",    authController.login);

router.get("/",       isAuth, authController.get);
router.get("/logout", isAuth, authController.logout);

// ── GET /user/api/me — بيانات العميل الكاملة ──
router.get("/api/me", isAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ success: false });
    const [rows] = await db.query(
      'SELECT Customer_Id as id, Customer_Name as name, Email as email, Phone as phone, Address as address, Avatar as avatar FROM Customers WHERE Customer_Id = ?',
      [userId]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ success: false });
    return res.json({ success: true, data: rows[0] });
  } catch(e) {
    return res.status(500).json({ success: false });
  }
});

const path = require('path');
const multer = require('multer');
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = path.join(__dirname, '../../public/uploads/avatars');
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '_' + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, name);
  }
});
const uploadAvatar = multer({ storage: avatarStorage });

router.put("/api/update",          isAuth, uploadAvatar.single('avatar'), authController.updateProfile);
router.post("/api/update",         isAuth, uploadAvatar.single('avatar'), authController.updateProfile);
router.put("/api/update-password", isAuth, authController.updatePassword);

module.exports = router;