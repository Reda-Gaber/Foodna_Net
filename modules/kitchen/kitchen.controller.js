/**
 * Kitchen Controller
 * معالجة منطق قسم المطبخ
 */
const kitchenModel = require('./kitchen.model');
const ApiResponse = require('../../core/utils/response');
const Logger = require('../../core/utils/logger');

/**
 * الحصول على الطلبات للمطبخ
 */
exports.getKitchenOrders = async (req, res) => {
  try {
    const orders = await kitchenModel.fetchPendingOrders();

    if (!orders || orders.length === 0) {
      return ApiResponse.success(res, { orders: [] }, 'لا توجد طلبات حالياً');
    }

    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const items = await kitchenModel.fetchOrderItems(order.Order_ID);

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

    console.log('🔵 Kitchen update request received:', { orderId, status, bodyKeys: Object.keys(req.body) });

    const parsedOrderId = Number(orderId);
    if (!parsedOrderId || !Number.isFinite(parsedOrderId) || parsedOrderId <= 0) {
      console.warn('❌ Invalid orderId:', orderId);
      return ApiResponse.validationError(res, null, 'معرف الطلب غير صحيح');
    }

    if (!status || typeof status !== 'string') {
      console.warn('❌ Invalid status:', status);
      return ApiResponse.validationError(res, null, 'الحالة مطلوبة وصحيحة');
    }

    const statusMap = {
      'Pending': 'Pending',
      'Processing': 'Processing',
      'Ready': 'Ready',
      'Completed': 'Delivered',
      'Delivered': 'Delivered',
      'Cancelled': 'Cancelled'
    };

    if (!statusMap[status]) {
      console.warn('❌ Disallowed status:', status, 'allowed:', Object.keys(statusMap));
      return ApiResponse.validationError(res, null, 'حالة غير صحيحة');
    }

    const dbStatus = statusMap[status];
    console.log(`✅ Mapped status '${status}' to database value '${dbStatus}'`);
    console.log('✅ Validation passed, updating order:', parsedOrderId, 'to status:', dbStatus);

    await kitchenModel.updateOrderStatus(parsedOrderId, dbStatus);

    Logger.audit('KITCHEN_ORDER_UPDATED', req.session.user?.id, { orderId: parsedOrderId, status });

    return ApiResponse.success(res, null, 'تم تحديث حالة الطلب بنجاح');
  } catch (error) {
    console.error('❌ Update kitchen status error:', error.message, error.sql);
    Logger.error('Update kitchen status error', error);
    return ApiResponse.error(res, 'فشل في تحديث حالة الطلب: ' + error.message, 500);
  }
};

