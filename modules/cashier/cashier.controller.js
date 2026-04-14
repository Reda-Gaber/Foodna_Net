/**
 * Cashier Controller
 * معالجة منطق قسم الكاشير (POS System)
 */
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
    // Simple query - get all products with their quantity
    const [products] = await db.query(
      `SELECT p.Product_ID, p.Product_Name, p.Price, p.Discount, p.Image, 
              p.Quantity, p.Category, p.Description
       FROM Products p
       ORDER BY p.Product_Name`
    );

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
    // TODO: عندما يتم إنشاء جدول Offers
    const [offers] = await db.query(
      `SELECT * FROM Offers WHERE Is_Active = 1`
    ).catch(() => [[]]);

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
  const validMethods = ['cash', 'card', 'check', 'transfer', 'mobile', 'other'];
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
async function _createOrderTransaction(connection, {
  items,
  totalAmount,
  paymentMethod,
  customerId,
  couponCode,
  discount,
  notes
}) {
  try {
    // التحقق من الكوبون إذا كان موجوداً
    let finalDiscount = discount || 0;
    let couponId = null;

    if (couponCode) {
      try {
        const coupon = await Coupon.validateCoupon(couponCode);
        if (coupon) {
          finalDiscount = Coupon.calculateDiscount(coupon, totalAmount);
          couponId = coupon.Coupon_ID;
        }
      } catch (err) {
        Logger.warn(`Coupon validation failed: ${couponCode}`, err);
        // لا نرفع خطأ - الكوبون ليس حرجاً
      }
    }

    const finalAmount = Math.max(0, totalAmount - finalDiscount);

    if (process.env.NODE_ENV !== 'production') {
      console.log('📝 Creating order with data:', {
        customerId: customerId || null,
        finalAmount,
        paymentMethod,
        notes
      });
    }

    // إنشاء الطلب
    const [orderResult] = await connection.query(
      `INSERT INTO Orders (Customer_ID, Total_Amount, Order_Status, Delivery_Address, Payment_Method, Created_At)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [customerId || null, finalAmount, 'Pending', 'في المتجر', paymentMethod]
    );

    const orderId = orderResult.insertId;
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Order created with ID:', orderId);
    }

    // إضافة تفاصيل الطلب
    for (const item of items) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📦 Adding item: productId=${item.productId}, qty=${item.quantity}, price=${item.price}`);
      }
      await connection.query(
        `INSERT INTO Order_Items (Order_ID, Product_ID, Quantity, Price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.productId, item.quantity, parseFloat(item.price)]
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ All items added to order');
    }

    // تطبيق الكوبون إذا كان موجوداً
    if (couponId && finalDiscount > 0) {
      try {
        await Coupon.applyCoupon(orderId, couponId, finalDiscount);
      } catch (err) {
        Logger.warn(`Failed to apply coupon ${couponId}: ${err.message}`);
        // لا نرفع خطأ - الطلب تم إنشاؤه بنجاح
      }
    }

    return {
      orderId,
      orderNumber: `#${orderId}`,
      totalAmount,
      discount: finalDiscount,
      finalAmount,
      paymentMethod
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Transaction error:', {
        message: error.message,
        code: error.code,
        sql: error.sql
      });
    }
    throw error;
  }
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
 * الحصول على تفاصيل الطلب للإيصال
 */
exports.getOrderReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;

    const [orders] = await db.query(
      'SELECT * FROM Orders WHERE Order_ID = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return ApiResponse.notFound(res, 'الطلب غير موجود');
    }

    const order = orders[0];
    const items = await Order.getOrderDetails(orderId);

    // الحصول على الخصم من الكوبون
    const [discounts] = await db.query(
      'SELECT Discount_Amount FROM Order_Discounts WHERE Order_ID = ?',
      [orderId]
    );
    const discount = discounts.length > 0 ? parseFloat(discounts[0].Discount_Amount) : 0;

    return ApiResponse.success(res, {
      order,
      items,
      discount
    }, 'تم جلب تفاصيل الطلب بنجاح');
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

    let whereClause = '';
    
    if (status === 'active') {
      // الطلبات النشطة: Pending, Shipped
      whereClause = `WHERE o.Order_Status IN ('Pending', 'Shipped')`;
    } else if (status === 'completed') {
      // الطلبات المكتملة: Delivered أو Cancelled
      whereClause = `WHERE o.Order_Status IN ('Delivered', 'Cancelled')`;
    } else {
      // جميع الطلبات
      whereClause = '';
    }

    const [orders] = await db.query(
      `SELECT o.Order_ID, o.Customer_ID, c.Customer_Name, o.Order_Status, o.Total_Amount, o.Created_At
       FROM Orders o
       LEFT JOIN Customers c ON o.Customer_ID = c.Customer_ID
       ${whereClause}
       ORDER BY o.Created_At DESC
       LIMIT 100`
    );

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

    // Map input statuses to valid database ENUM values
    const statusMap = {
      'Pending': 'Pending',
      'Processing': 'Shipped',    // جاري المعالجة -> تم الشحن
      'Ready': 'Shipped',         // جاهز -> تم الشحن
      'Shipped': 'Shipped',
      'Delivered': 'Delivered',
      'Cancelled': 'Cancelled'
    };
    
    if (!statusMap[status]) {
      return ApiResponse.validationError(res, null, 'حالة غير صحيحة');
    }

    const dbStatus = statusMap[status];
    
    // تحديث حالة الطلب
    const [result] = await db.query(
      'UPDATE Orders SET Order_Status = ? WHERE Order_ID = ?',
      [dbStatus, orderId]
    );

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

