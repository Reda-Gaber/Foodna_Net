/**
 * Unified Authentication Routes
 * مسارات المصادقة الموحدة
 */
const express = require('express');
const router = express.Router();
const authController = require('./unified-auth.controller');

// صفحة تسجيل الدخول
router.get('/login', (req, res) => {
  const allowSwitch = req.query.switch === 'true';
  const currentRole = req.session?.user?.role || req.session?.role;

  // لو مسجل دخول كـ Employee (مش Client)، ارجعه للـ dashboard بتاعه
  if (req.session?.userId && currentRole && currentRole !== 'Client' && !allowSwitch) {
    switch (currentRole) {
      case 'Admin':   return res.redirect('/admin/dashboard');
      case 'Cashier': return res.redirect('/cashier');
      case 'Chef':
      case 'Kitchen': return res.redirect('/kitchen');
      default:        return res.redirect('/');
    }
  }

  // لو Client مسجل دخول أو مش مسجل دخول خالص → اعرض صفحة اللوجين
  // عشان يقدر يسجل دخول بـ account تاني (Admin/Cashier/Chef)
  res.render('auth/unified-login');
});

// تسجيل الدخول — بيرجع JSON مع redirect URL
// الـ redirect بييجي من unified-auth.controller اللي بيشيك على:
// 1. req.body.next لو جاي من فورم فيه next
// 2. role المستخدم (Admin → /admin/dashboard, Client → /, إلخ)
router.post('/login', authController.unifiedLogin);

// تسجيل الخروج
// Logout now requires POST with CSRF protection
router.post('/logout', authController.unifiedLogout);

// API: التحقق من حالة تسجيل الدخول
router.get('/api/auth/check', authController.checkAuth);

module.exports = router;