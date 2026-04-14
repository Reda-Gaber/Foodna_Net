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

/**
 * صفحة لوحة تحكم الكاشير
 * يتطلب تسجيل دخول موظف كاشير
 */
router.get('/', (req, res) => {
  // التحقق من تسجيل الدخول
  if (!req.session.user) {
    return res.redirect('/auth');
  }
  
  // التحقق من الدور
  const role = req.session.user.role;
  if (role !== 'Cashier') {
    return res.status(403).render('error', { 
      message: 'ليس لديك صلاحية للوصول إلى قسم الكاشير' 
    });
  }
  
  res.render('cashier/dashboard', { user: req.session.user });
});

/**
 * صفحة الإيصال
 * متاحة بدون تسجيل دخول (للطلبات الجديدة)
 */
router.get('/receipt/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const db = require('../../config/db');
    
    const [orders] = await db.query(
      'SELECT * FROM Orders WHERE Order_ID = ?',
      [orderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).render('error', { message: 'الطلب غير موجود' });
    }
    
    const order = orders[0];
    
    const [items] = await db.query(
      `SELECT oi.*, p.Product_Name
       FROM Order_Items oi
       JOIN Products p ON oi.Product_ID = p.Product_ID
       WHERE oi.Order_ID = ?`,
      [orderId]
    );
    
    // الحصول على الخصم من الكوبون
    const [discounts] = await db.query(
      'SELECT Discount_Amount FROM Order_Discounts WHERE Order_ID = ?',
      [orderId]
    );
    const discount = discounts.length > 0 ? parseFloat(discounts[0].Discount_Amount) : 0;
    
    res.render('cashier/receipt', { order, items, discount });
  } catch (error) {
    res.status(500).render('error', { message: 'حدث خطأ في جلب الإيصال' });
  }
});

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

