/**
 * Unified Authentication Routes
 * مسارات المصادقة الموحدة
 */
const express = require('express');
const router = express.Router();
const authController = require('./unified-auth.controller');

// توجيه تسجيل العملاء من مسار الموظفين القديم
router.get('/register', (req, res) => {
  const q = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  res.redirect('/user/register' + q);
});

// صفحة تسجيل الدخول — متاحة دائماً (حتى مع جلسة نشطة لتبديل الحساب)
router.get('/login', (req, res) => {
  res.render('auth/unified-login');
});

// تسجيل الدخول — بيرجع JSON مع redirect URL
// الـ redirect بييجي من unified-auth.controller اللي بيشيك على:
// 1. req.body.next لو جاي من فورم فيه next
// 2. role المستخدم (Admin → /admin/dashboard, Client → /, إلخ)
router.post('/login', authController.unifiedLogin);

// تسجيل الخروج
router.get('/logout', authController.unifiedLogoutGet);
router.post('/logout', authController.unifiedLogout);

// API: التحقق من حالة تسجيل الدخول
router.get('/api/auth/check', authController.checkAuth);

module.exports = router;