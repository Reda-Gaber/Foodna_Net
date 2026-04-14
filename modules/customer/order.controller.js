/**
 * Order Controller
 * معالجة منطق الطلبات
 */

const Order = require('./order.model');
const Cart = require('./cart.model');
const ApiResponse = require('../../core/utils/response');
const Logger = require('../../core/utils/logger');

/**
 * إنشاء طلب جديد
 */
exports.createOrder = async (req, res) => {
  try {
    const customerId = req.session.userId;
    const { items, deliveryAddress, totalAmount, paymentMethod = 'cash', phone, notes } = req.body;

    console.log('[ORDER-CTRL] Creating order for customer:', customerId);
    console.log('[ORDER-CTRL] Request body:', { items, deliveryAddress, totalAmount, paymentMethod });

    if (!customerId) {
      console.log('[ORDER-CTRL] Error: No customer ID in session');
      return ApiResponse.unauthorized(res, 'يجب تسجيل الدخول أولاً');
    }

    if (!deliveryAddress) {
      console.log('[ORDER-CTRL] Error: No delivery address provided');
      return ApiResponse.validationError(res, null, 'عنوان التوصيل مطلوب');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('[ORDER-CTRL] Error: No items in request or items is not an array:', items);
      return ApiResponse.validationError(res, null, 'السلة فارغة أو صيغة غير صحيحة', 400);
    }

    if (!totalAmount || totalAmount <= 0) {
      console.log('[ORDER-CTRL] Error: Invalid total amount:', totalAmount);
      return ApiResponse.validationError(res, null, 'المبلغ الإجمالي غير صحيح', 400);
    }

    // Map frontend field names to database field names with validation
    const cartItems = items.map((item, idx) => {
      console.log(`[ORDER-CTRL] Processing item ${idx}:`, item);
      const productId = item.productId || item.Product_ID || item.ProductId;
      const quantity = item.quantity || item.Quantity;
      const price = item.price || item.Price;
      
      if (!productId || !quantity || price === undefined || price === null) {
        throw new Error(`Item ${idx} has missing properties: productId=${productId}, quantity=${quantity}, price=${price}`);
      }
      
      return {
        Product_ID: Number(productId),
        Quantity: Number(quantity),
        price: Number(price)
      };
    });

    console.log('[ORDER-CTRL] Mapped cart items:', JSON.stringify(cartItems));

    // Validate items exist and have stock
    for (const item of cartItems) {
      try {
        console.log(`[ORDER-CTRL] Validating item Product_ID=${item.Product_ID}, Quantity=${item.Quantity}`);
        await Cart.validateCartItem(item.Product_ID, item.Quantity);
        console.log(`[ORDER-CTRL] ✓ Item Product_ID=${item.Product_ID} validated successfully`);
      } catch (error) {
        console.log('[ORDER-CTRL] Validation error for item:', item.Product_ID, error.message);
        return ApiResponse.error(res, error.message, 400);
      }
    }

    // Create the order
    console.log('[ORDER-CTRL] Creating order with Order.create()');
    const orderId = await Order.create(customerId, cartItems, totalAmount, deliveryAddress, paymentMethod);

    console.log('[ORDER-CTRL] ✓ Order created successfully with ID:', orderId);
    Logger.audit('ORDER_CREATED', customerId, { orderId, totalAmount, paymentMethod, phone });

    return ApiResponse.success(res, { orderId, orderNumber: orderId, totalAmount }, 'تم إنشاء الطلب بنجاح', 201);
  } catch (error) {
    console.error('[ORDER-CTRL] ✗ Error creating order:', error.message || error);
    console.error('[ORDER-CTRL] Error stack:', error.stack);
    Logger.error('Order creation error', error);
    return ApiResponse.error(res, 'فشل في إنشاء الطلب: ' + (error.message || 'خطأ غير معروف'), 500);
  }
};

/**
 * الحصول على طلبات العميل
 */
exports.getOrders = async (req, res) => {
  try {
    const customerId = req.session.userId;
    if (!customerId) {
      return ApiResponse.unauthorized(res);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const orders = await Order.getOrdersByCustomer(customerId, limit, offset);
    return ApiResponse.success(res, orders, 'تم جلب الطلبات بنجاح');
  } catch (error) {
    Logger.error('Get orders error', error);
    return ApiResponse.error(res, 'فشل في جلب الطلبات', 500);
  }
};

/**
 * الحصول على تفاصيل طلب معين
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const customerId = req.session.userId;
    const { orderId } = req.params;

    if (!customerId) {
      return ApiResponse.unauthorized(res);
    }

    const order = await Order.getOrderById(orderId, customerId);
    if (!order) {
      return ApiResponse.notFound(res, 'الطلب غير موجود');
    }

    const details = await Order.getOrderDetails(orderId);
    return ApiResponse.success(res, { order, items: details }, 'تم جلب تفاصيل الطلب بنجاح');
  } catch (error) {
    Logger.error('Get order details error', error);
    return ApiResponse.error(res, 'فشل في جلب تفاصيل الطلب', 500);
  }
};

/**
 * إلغاء طلب
 */
exports.cancelOrder = async (req, res) => {
  try {
    const customerId = req.session.userId;
    const { orderId } = req.params;

    if (!customerId) {
      return ApiResponse.unauthorized(res);
    }

    await Order.cancelOrder(orderId, customerId);
    Logger.audit('ORDER_CANCELLED', customerId, { orderId });

    return ApiResponse.success(res, null, 'تم إلغاء الطلب بنجاح');
  } catch (error) {
    Logger.error('Cancel order error', error);
    return ApiResponse.error(res, error.message || 'فشل في إلغاء الطلب', 400);
  }
};



