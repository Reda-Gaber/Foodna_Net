/**
 * Unified Authentication Routes
 * مسارات المصادقة الموحدة
 */
const express = require('express');
const router = express.Router();
const authController = require('./unified-auth.controller');

// صفحة تسجيل الدخول
router.get('/login', (req, res) => {
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



