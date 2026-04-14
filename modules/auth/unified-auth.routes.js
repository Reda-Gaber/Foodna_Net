/**
 * Unified Authentication Routes
 * مسارات المصادقة الموحدة
 */
const express = require('express');
const router = express.Router();
const authController = require('./unified-auth.controller');

// صفحة تسجيل الدخول
router.get('/login', (req, res) => {
  // إذا كان المستخدم مسجل دخول بالفعل، أعد توجيهه
  if (req.session.user || req.session.userId) {
    const role = req.session.user?.role || req.session.role || 'Client';
    switch (role) {
      case 'Admin':
        return res.redirect('/admin/dashboard');
      case 'Cashier':
        return res.redirect('/cashier');
      case 'Chef':
      case 'Kitchen':
        return res.redirect('/kitchen');
      default:
        return res.redirect('/');
    }
  }
  res.render('auth/unified-login');
});

// تسجيل الدخول
router.post('/login', authController.unifiedLogin);

// تسجيل الخروج
router.get('/logout', authController.unifiedLogout);
router.post('/logout', authController.unifiedLogout);

// API: التحقق من حالة تسجيل الدخول
router.get('/api/auth/check', authController.checkAuth);

module.exports = router;



