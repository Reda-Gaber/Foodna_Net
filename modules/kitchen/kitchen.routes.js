/**
 * Kitchen Routes
 * مسارات قسم المطبخ
 */
const express = require('express');
const router = express.Router();
const kitchenController = require('./kitchen.controller');
const { requireEmployee, authorizeRole } = require('../../core/middlewares/authMiddleware');

// Middleware: إعادة تحميل الجلسة من قاعدة البيانات
router.use((req, res, next) => {
  if (req.session && req.session.reload) {
    req.session.reload((err) => {
      if (err) {
        console.error('❌ Session reload error:', err);
      } else {
        console.log('✅ Session reloaded from database');
      }
      next();
    });
  } else {
    next();
  }
});

// صفحة لوحة تحكم المطبخ
router.get('/', (req, res) => {
  console.log('🔵 Kitchen dashboard access attempt');
  console.log('Session data:', {
    user: req.session?.user,
    authenticated: req.session?.authenticated,
    role: req.session?.user?.role
  });

  // التحقق من تسجيل الدخول
  if (!req.session.user) {
    console.warn('⚠️ No session user found, redirecting to login');
    return res.redirect('/login');
  }
  
  // التحقق من الدور
  const role = req.session.user.role;
  if (role !== 'Chef' && role !== 'Kitchen') {
    console.warn('⚠️ User role not authorized:', role);
    return res.status(403).render('error', { 
      message: 'ليس لديك صلاحية للوصول إلى قسم المطبخ' 
    });
  }
  
  console.log('✅ Kitchen dashboard access granted for role:', role);
  res.render('kitchen/dashboard', { user: req.session.user });
});

// Debug middleware لجميع طلبات /api
router.use('/api', (req, res, next) => {
  console.log('🔵 Kitchen API request:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body,
    session: req.session?.user ? 'authenticated' : 'not authenticated'
  });
  next();
});

// جميع API routes تتطلب تسجيل دخول كموظف
router.use('/api', requireEmployee);

// التحقق من أن المستخدم هو Kitchen/Chef للـ API
router.use('/api', (req, res, next) => {
  const role = req.session.user?.role;
  if (role !== 'Chef' && role !== 'Kitchen') {
    return res.status(403).json({ 
      success: false,
      message: 'ليس لديك صلاحية للوصول إلى قسم المطبخ' 
    });
  }
  next();
});

// API: الحصول على الطلبات
router.get('/api/orders', kitchenController.getKitchenOrders);

// API: تحديث حالة الطلب
router.post('/api/update', kitchenController.updateKitchenStatus);

module.exports = router;

