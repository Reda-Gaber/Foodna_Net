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

// صفحة تسجيل الدخول
router.get('/login', (req, res) => {
  const allowSwitch = req.query.switch === 'true';
  const currentRole = req.session?.user?.role || req.session?.role;
  const isLoggedIn  = !!(req.session?.userId || req.session?.user?.id);

  if (isLoggedIn && !allowSwitch) {
    // ✅ Client مسجل دخول → ارجعه للصفحة الرئيسية، مش صفحة الموظفين
    if (!currentRole || currentRole === 'Client') {
      return res.redirect('/');
    }

    // موظف مسجل دخول → ارجعه للـ dashboard بتاعه
    switch (currentRole) {
      case 'Admin':   return res.redirect('/admin/dashboard');
      case 'Cashier': return res.redirect('/cashier');
      case 'Chef':
      case 'Kitchen': return res.redirect('/kitchen');
      default:        return res.redirect('/');
    }
  }

  // مش مسجل دخول أو allowSwitch=true → اعرض صفحة اللوجين
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