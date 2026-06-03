const express = require("express");
const router = express.Router();
const db = require("../../config/db");

const authController = require("./auth.controller");
const { requireClient } = require('../../core/middlewares/authMiddleware');

router.get("/register", (req, res) => {
  // لا تُمرَّر بيانات الدخول في الرابط (أمان)
  if (req.query.email || req.query.password) {
    const q = new URLSearchParams();
    if (req.query.next) q.set('next', req.query.next);
    if (req.query.success) q.set('success', req.query.success);
    const suffix = q.toString() ? '?' + q.toString() : '';
    return res.redirect('/user/register' + suffix);
  }
  res.render("auth/customer-register", { error: null, success: req.query.success, next: req.query.next || '' });
});
router.get("/emailisexist", authController.emailIsExists);

router.post("/register", authController.createAccount);
router.post("/login",    authController.login);

router.get("/",       requireClient, authController.get);
router.get("/logout", requireClient, authController.logout);

// ── GET /user/api/me — بيانات العميل الكاملة ──
router.get("/api/me", requireClient, async (req, res) => {
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
const avatarStorage = multer.memoryStorage();
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('صور فقط!'));
  }
});

router.put("/api/update",          requireClient, uploadAvatar.single('avatar'), authController.updateProfile);
router.post("/api/update",         requireClient, uploadAvatar.single('avatar'), authController.updateProfile);
router.put("/api/update-password", requireClient, authController.updatePassword);

module.exports = router;