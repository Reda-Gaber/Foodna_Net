/**
 * Cashier Controller
 * معالجة منطق قسم الكاشير (POS System)
 */
const CashierModel = require('./cashier.model');
const db = require('../../config/db');
const Order = require('../customer/order.model');
const Coupon = require('../admin/coupon.model');
const ApiResponse = require('../../core/utils/response');
const Logger = require('../../core/utils/logger');

/**
 * الحصول على جميع المنتجات للكاشير
 */
exports.getProducts = async (req, res) => {
  try {
    const products = await CashierModel.fetchProducts();
    return ApiResponse.success(res, products, 'تم جلب المنتجات بنجاح');
  } catch (error) {
    Logger.error('Get cashier products error', error);
    return ApiResponse.error(res, 'فشل في جلب المنتجات', 500);
  }
};

/**
 * الحصول على العروض (Offers)
 */
exports.getOffers = async (req, res) => {
  try {
    const offers = await CashierModel.fetchOffers();
    return ApiResponse.success(res, offers, 'تم جلب العروض بنجاح');
  } catch (error) {
    Logger.error('Get offers error', error);
    return ApiResponse.error(res, 'فشل في جلب العروض', 500);
  }
};

/**
 * التحقق من الكوبون وتطبيقه
 */
exports.validateCoupon = async (req, res) => {
  try {
    const { code, totalAmount } = req.body;

    if (!code) {
      return ApiResponse.validationError(res, null, 'كود الكوبون مطلوب');
    }

    const coupon = await Coupon.validateCoupon(code);
    if (!coupon) {
      return ApiResponse.error(res, 'الكوبون غير صالح أو منتهي الصلاحية', 400);
    }

    if (totalAmount) {
      const discount = Coupon.calculateDiscount(coupon, totalAmount);
      return ApiResponse.success(res, { 
        coupon, 
        discount,
        finalAmount: totalAmount - discount
      }, 'الكوبون صالح');
    }

    return ApiResponse.success(res, { coupon }, 'الكوبون صالح');
  } catch (error) {
    Logger.error('Validate coupon error', error);
    return ApiResponse.error(res, error.message || 'فشل في التحقق من الكوبون', 400);
  }
};

/**
 * التحقق من صحة عناصر الطلب
 * @private
 */
function validateOrderItems(items) {
  // تحقق من أن items موجود وليس فارغاً
  if (!Array.isArray(items) || items.length === 0) {
    return {
      valid: false,
      error: 'items array must contain at least one item | يجب أن تحتوي السلة على منتج واحد على الأقل'
    };
  }

  // تحقق من كل عنصر
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // تحقق من وجود productId
    if (!item.productId && item.productId !== 0) {
      return {
        valid: false,
        error: `Item ${i + 1}: productId is required | productId مطلوب`
      };
    }

    // تحقق من أن productId رقم
    if (typeof item.productId !== 'number' || !Number.isInteger(item.productId) || item.productId <= 0) {
      return {
        valid: false,
        error: `Item ${i + 1}: productId must be a positive integer | productId يجب أن يكون رقماً موجباً`
      };
    }

    // تحقق من وجود quantity
    if (!item.quantity && item.quantity !== 0) {
      return {
        valid: false,
        error: `Item ${i + 1}: quantity is required | quantity مطلوب`
      };
    }

    // تحقق من أن quantity رقم موجب
    if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      return {
        valid: false,
        error: `Item ${i + 1}: quantity must be a positive integer | quantity يجب أن يكون رقماً موجباً`
      };
    }

    // تحقق من وجود price
    if (item.price === undefined || item.price === null) {
      return {
        valid: false,
        error: `Item ${i + 1}: price is required | price مطلوب`
      };
    }

    // تحقق من أن price رقم موجب أو صفر
    if (typeof item.price !== 'number' || item.price < 0) {
      return {
        valid: false,
        error: `Item ${i + 1}: price must be a non-negative number | price يجب أن يكون رقماً موجباً`
      };
    }
  }

  return { valid: true };
}

/**
 * التحقق من صحة طريقة الدفع
 * @private
 */
function validatePaymentMethod(paymentMethod) {
  const validMethods = ['cash', 'card', 'check', 'transfer', 'mobile', 'other', 'wallet'];
  if (!paymentMethod || !validMethods.includes(paymentMethod.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid payment method. Valid options: ${validMethods.join(', ')} | طريقة دفع غير صحيحة`
    };
  }
  return { valid: true };
}

/**
 * Helper function - إنشاء طلب (مشترك بين الـ endpoints)
 * @private
 */
async function _createOrderTransaction(connection, orderParams) {
  return CashierModel.createOrder(connection, orderParams);
}

/**
 * إنشاء طلب من الكاشير (للعملاء المسجلين)
 * يتطلب المصادقة
 */
exports.createOrder = async (req, res) => {
  try {
    const { items, totalAmount, couponCode, discount, paymentMethod, customerId, notes } = req.body;
    const cashierId = req.session?.user?.id;

    // التحقق من الـ items
    const itemsValidation = validateOrderItems(items);
    if (!itemsValidation.valid) {
      return ApiResponse.validationError(res, null, itemsValidation.error, 400);
    }

    // التحقق من totalAmount
    if (!totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
      return ApiResponse.validationError(res, null, 'Total amount must be a positive number | المبلغ الإجمالي يجب أن يكون رقماً موجباً', 400);
    }

    // التحقق من طريقة الدفع
    const paymentValidation = validatePaymentMethod(paymentMethod);
    if (!paymentValidation.valid) {
      return ApiResponse.validationError(res, paymentValidation.error, paymentValidation.error, 400);
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const orderData = await _createOrderTransaction(connection, {
        items,
        totalAmount,
        paymentMethod: paymentMethod.toLowerCase(),
        customerId,
        couponCode,
        discount,
        notes
      });

      await connection.commit();

      Logger.audit('CASHIER_ORDER_CREATED', cashierId || 'anonymous', { 
        orderId: orderData.orderId, 
        customerId: customerId || null,
        totalAmount, 
        finalAmount: orderData.finalAmount 
      });

      return ApiResponse.success(res, orderData, 'تم إنشاء الطلب بنجاح', 201);

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    Logger.error('Create cashier order error', error);
    return ApiResponse.error(res, 'Failed to create order | فشل في إنشاء الطلب', 500);
  }
};

/**
 * إنشاء طلب من الكاشير (بدون حساب عميل)
 * لا يتطلب المصادقة - للعملاء غير المسجلين
 */
exports.createPublicOrder = async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, couponCode, discount, notes } = req.body;

    // التحقق من الـ items
    const itemsValidation = validateOrderItems(items);
    if (!itemsValidation.valid) {
      return ApiResponse.validationError(res, null, itemsValidation.error, 400);
    }

    // التحقق من totalAmount
    if (!totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
      return ApiResponse.validationError(res, null, 'Total amount must be a positive number | المبلغ الإجمالي يجب أن يكون رقماً موجباً', 400);
    }

    // التحقق من paymentMethod (مطلوب)
    if (!paymentMethod) {
      return ApiResponse.validationError(res, null, 'Payment method is required | طريقة الدفع مطلوبة', 400);
    }

    const paymentValidation = validatePaymentMethod(paymentMethod);
    if (!paymentValidation.valid) {
      return ApiResponse.validationError(res, null, paymentValidation.error, 400);
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const orderData = await _createOrderTransaction(connection, {
        items,
        totalAmount,
        paymentMethod: paymentMethod.toLowerCase(),
        customerId: null, // لا يوجد عميل
        couponCode,
        discount,
        notes
      });

      await connection.commit();

      Logger.audit('PUBLIC_ORDER_CREATED', 'system', { 
        orderId: orderData.orderId, 
        totalAmount, 
        finalAmount: orderData.finalAmount 
      });

      return ApiResponse.success(res, orderData, 'تم إنشاء الطلب بنجاح', 201);

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Create public order error details:', {
        message: error.message,
        code: error.code,
        sql: error.sql,
        stack: error.stack
      });
    }
    Logger.error('Create public order error', error);
    const errorMsg = process.env.NODE_ENV === 'production' 
      ? 'Failed to create order | فشل في إنشاء الطلب' 
      : `Failed to create order | فشل في إنشاء الطلب: ${error.message}`;
    return ApiResponse.error(res, errorMsg, 500);
  }
};

/**
 * صفحة الإيصال (HTML)
 */
exports.getReceiptPage = async (req, res) => {
  try {
    const { orderId } = req.params;
    const data = await CashierModel.fetchReceiptPageData(orderId);
    
    if (!data) {
      return res.status(404).render('error', { message: 'الطلب غير موجود' });
    }

    res.render('cashier/receipt', { 
      order: data.order, 
      items: data.items, 
      discount: data.discount 
    });
  } catch (error) {
    res.status(500).render('error', { message: 'حدث خطأ في جلب الإيصال' });
  }
};

/**
 * الحصول على تفاصيل الطلب للإيصال
 */
exports.getOrderReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;
    const data = await CashierModel.fetchOrderReceipt(orderId);

    if (!data) {
      return ApiResponse.notFound(res, 'الطلب غير موجود');
    }

    return ApiResponse.success(res, data, 'تم جلب تفاصيل الطلب بنجاح');
  } catch (error) {
    Logger.error('Get order receipt error', error);
    return ApiResponse.error(res, 'فشل في جلب تفاصيل الطلب', 500);
  }
};

/**
 * الحصول على الطلبات (نشطة أو مكتملة)
 */
exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const orders = await CashierModel.fetchOrders(status);
    return ApiResponse.success(res, orders, 'تم جلب الطلبات بنجاح');
  } catch (error) {
    Logger.error('Get orders error', error);
    return ApiResponse.error(res, 'فشل في جلب الطلبات', 500);
  }
};

/**
 * تحديث حالة الطلب
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const cashierId = req.session.user?.id;

    if (!status) {
      return ApiResponse.validationError(res, null, 'الحالة مطلوبة');
    }

    // Mapping من القيم المعروضة في الواجهة إلى القيم الموجودة فعلاً في الـ ENUM
    const statusMap = {
      'Pending':    'Pending',
      'Processing': 'Processing',
      'Ready':      'Ready',
      'Delivered':  'Delivered',
      'Cancelled':  'Cancelled'
    };

    if (!statusMap[status]) {
      return ApiResponse.validationError(res, null, `حالة غير صحيحة. القيم المقبولة: ${Object.keys(statusMap).join(', ')}`);
    }

    const dbStatus = statusMap[status];
    const result = await CashierModel.updateOrderStatus(orderId, dbStatus);

    if (result.affectedRows === 0) {
      return ApiResponse.notFound(res, 'الطلب غير موجود');
    }

    Logger.audit('CASHIER_ORDER_STATUS_UPDATED', cashierId, { orderId, status });

    return ApiResponse.success(res, { orderId, status }, 'تم تحديث حالة الطلب بنجاح');
  } catch (error) {
    Logger.error('Update order status error', error);
    return ApiResponse.error(res, 'فشل في تحديث حالة الطلب', 500);
  }
};