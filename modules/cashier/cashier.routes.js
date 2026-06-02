/**
 * Cashier Routes
 * مسارات قسم الكاشير
 */
const express = require('express');
const router = express.Router();
const cashierController = require('./cashier.controller');
const { requireEmployee, authorizeRole } = require('../../core/middlewares/authMiddleware');

// =====================================================
// PROTECTED ROUTES (Page & Dashboard)
// =====================================================

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

/**
 * صفحة لوحة تحكم الكاشير
 * يتطلب تسجيل دخول موظف كاشير
 */
router.get('/', (req, res) => {
  console.log('🔵 Cashier dashboard access attempt');
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
  if (role !== 'Cashier') {
    console.warn('⚠️ User role not authorized:', role);
    return res.status(403).render('error', { 
      message: 'ليس لديك صلاحية للوصول إلى قسم الكاشير' 
    });
  }
  
  console.log('✅ Cashier dashboard access granted for role:', role);
  res.render('cashier/dashboard', { user: req.session.user });
});

/**
 * صفحة الإيصال
 * متاحة بدون تسجيل دخول (للطلبات الجديدة)
 */
router.get('/receipt/:orderId', cashierController.getReceiptPage);

// =====================================================
// PUBLIC API ROUTES (No Authentication Required)
// =====================================================

/**
 * إنشاء طلب جديد بدون حساب عميل
 * POST /api/cashier/orders
 * 
 * Request Body:
 * {
 *   "items": [
 *     { "productId": 1, "quantity": 2, "price": 100 },
 *     { "productId": 2, "quantity": 1, "price": 50 }
 *   ],
 *   "totalAmount": 250,
 *   "paymentMethod": "cash",
 *   "couponCode": "DISCOUNT10" (optional),
 *   "discount": 10 (optional),
 *   "notes": "Special instructions" (optional)
 * }
 * 
 * Response (201):
 * {
 *   "success": true,
 *   "data": {
 *     "orderId": 123,
 *     "orderNumber": "#123",
 *     "totalAmount": 250,
 *     "discount": 10,
 *     "finalAmount": 240,
 *     "paymentMethod": "cash"
 *   },
 *   "message": "تم إنشاء الطلب بنجاح"
 * }
 */
router.post('/api/orders', cashierController.createPublicOrder);

/**
 * الحصول على المنتجات
 * لا يتطلب مصادقة
 */
router.get('/api/products', cashierController.getProducts);

/**
 * الحصول على العروض
 * لا يتطلب مصادقة
 */
router.get('/api/offers', cashierController.getOffers);

/**
 * التحقق من الكوبون
 * لا يتطلب مصادقة
 */
router.post('/api/coupon/validate', cashierController.validateCoupon);

// =====================================================
// PROTECTED API ROUTES (Authentication Required)
// =====================================================

/**
 * جميع API routes التالية تتطلب تسجيل دخول موظف
 */
router.use('/api/authenticated', requireEmployee);

/**
 * جميع API routes التالية تتطلب دور Cashier
 */
router.use('/api/authenticated', (req, res, next) => {
  const role = req.session.user?.role;
  if (role !== 'Cashier') {
    return res.status(403).json({ 
      success: false,
      message: 'ليس لديك صلاحية للوصول إلى هذا المورد'
    });
  }
  next();
});

/**
 * إنشاء طلب مع حساب عميل
 * POST /api/authenticated/orders
 * 
 * يتطلب: Cashier employee session
 * 
 * Request Body:
 * {
 *   "items": [...],
 *   "totalAmount": 250,
 *   "paymentMethod": "cash",
 *   "customerId": 5 (optional - للعملاء المسجلين),
 *   "couponCode": "DISCOUNT10" (optional),
 *   "discount": 10 (optional),
 *   "notes": "Special instructions" (optional)
 * }
 */
router.post('/api/authenticated/orders', cashierController.createOrder);

/**
 * الحصول على الطلبات
 * GET /api/authenticated/orders?status=active|completed|all
 */
router.get('/api/authenticated/orders', cashierController.getOrders);

/**
 * تحديث حالة الطلب
 * POST /api/authenticated/orders/:orderId/status
 */
router.post('/api/authenticated/orders/:orderId/status', cashierController.updateOrderStatus);

/**
 * الحصول على تفاصيل الطلب للإيصال
 * GET /api/authenticated/orders/:orderId/receipt
 */
router.get('/api/authenticated/orders/:orderId/receipt', cashierController.getOrderReceipt);

module.exports = router;

