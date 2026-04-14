/**
 * Kitchen Controller
 * معالجة منطق قسم المطبخ
 */
const db = require('../../config/db');
const Order = require('../customer/order.model');
const ApiResponse = require('../../core/utils/response');
const Logger = require('../../core/utils/logger');

/**
 * الحصول على الطلبات للمطبخ
 */
exports.getKitchenOrders = async (req, res) => {
  try {
    // الحصول على الطلبات التي لم تكتمل بعد (Pending و Shipped)
    const [orders] = await db.query(
      `SELECT DISTINCT
          o.Order_ID,
          o.Total_Amount,
          o.Order_Status,
          o.Created_At,
          COALESCE(c.Customer_Name, 'عميل الكاشير') as Customer_Name
       FROM Orders o
       LEFT JOIN Customers c ON o.Customer_ID = c.Customer_Id
       LEFT JOIN Order_Items oi ON o.Order_ID = oi.Order_ID
       WHERE o.Order_Status IN ('Pending', 'Shipped')
       ORDER BY o.Created_At ASC
       LIMIT 50`
    );

    // إذا لم يكن هناك طلبات
    if (orders.length === 0) {
      return ApiResponse.success(res, { orders: [] }, 'لا توجد طلبات حالياً');
    }

    // الحصول على تفاصيل كل طلب
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const [items] = await db.query(
          `SELECT oi.*, p.Product_Name, p.Image
           FROM Order_Items oi
           JOIN Products p ON oi.Product_ID = p.Product_ID
           WHERE oi.Order_ID = ?`,
          [order.Order_ID]
        );

        return {
          id: order.Order_ID,
          orderNumber: `#${order.Order_ID}`,
          customer: order.Customer_Name || 'عميل الكاشير',
          status: order.Order_Status || 'Pending',
          total: parseFloat(order.Total_Amount || 0),
          createdAt: order.Created_At,
          items: items.map(item => ({
            name: item.Product_Name,
            quantity: item.Quantity,
            price: parseFloat(item.Price || 0),
            image: item.Image || null
          }))
        };
      })
    );

    return ApiResponse.success(res, { orders: ordersWithDetails }, 'تم جلب الطلبات بنجاح');
  } catch (error) {
    Logger.error('Get kitchen orders error', error);
    return ApiResponse.error(res, 'فشل في جلب الطلبات', 500);
  }
};

/**
 * تحديث حالة الطلب في المطبخ
 */
exports.updateKitchenStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    
    // Log incoming request
    console.log('🔵 Kitchen update request received:', { orderId, status, bodyKeys: Object.keys(req.body) });

    // Validate inputs (coerce orderId to number)
    const parsedOrderId = Number(orderId);
    if (!parsedOrderId || !Number.isFinite(parsedOrderId) || parsedOrderId <= 0) {
      console.warn('❌ Invalid orderId:', orderId);
      return ApiResponse.validationError(res, null, 'معرف الطلب غير صحيح');
    }

    if (!status || typeof status !== 'string') {
      console.warn('❌ Invalid status:', status);
      return ApiResponse.validationError(res, null, 'الحالة مطلوبة وصحيحة');
    }

    // التحقق من الحالات المسموحة
    // Database ENUM values: 'Pending', 'Shipped', 'Delivered', 'Cancelled'
    const statusMap = {
      'Pending': 'Pending',
      'Processing': 'Shipped',    // جاري المعالجة -> تم الشحن
      'Ready': 'Shipped',         // جاهز -> تم الشحن
      'Completed': 'Shipped',     // مكتمل -> تم الشحن
      'Delivered': 'Delivered',
      'Shipped': 'Shipped',
      'Cancelled': 'Cancelled'
    };

    if (!statusMap[status]) {
      console.warn('❌ Disallowed status:', status, 'allowed:', Object.keys(statusMap));
      return ApiResponse.validationError(res, null, 'حالة غير صحيحة');
    }

    const dbStatus = statusMap[status];
    console.log(`✅ Mapped status '${status}' to database value '${dbStatus}'`);

    console.log('✅ Validation passed, updating order:', parsedOrderId, 'to status:', dbStatus);

    // تحديث حالة الطلب
    const updateQuery = `UPDATE Orders SET Order_Status = ? WHERE Order_ID = ?`;
    
    const result = await db.query(updateQuery, [dbStatus, parsedOrderId]);
    console.log('✅ Database update result:', result);

    Logger.audit('KITCHEN_ORDER_UPDATED', req.session.user?.id, { orderId: parsedOrderId, status });

    return ApiResponse.success(res, null, 'تم تحديث حالة الطلب بنجاح');
  } catch (error) {
    console.error('❌ Update kitchen status error:', error.message, error.sql);
    Logger.error('Update kitchen status error', error);
    return ApiResponse.error(res, 'فشل في تحديث حالة الطلب: ' + error.message, 500);
  }
};

