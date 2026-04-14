/**
 * Cart Controller
 * معالجة منطق السلة
 */
const Cart = require('./cart.model');
const ApiResponse = require('../../core/utils/response');
const Logger = require('../../core/utils/logger');
const { requireCustomer } = require('../../core/middlewares/authMiddleware');

/**
 * إضافة منتج إلى السلة
 */
const addProduct = async (req, res) => {
  try {
    const Customer_ID = req.session.userId;
    if (!Customer_ID) {
      return ApiResponse.unauthorized(res);
    }

    const { Product_ID, Quantity } = req.body;

    if (!Product_ID || !Quantity) {
      return ApiResponse.validationError(res, null, 'معرف المنتج والكمية مطلوبان');
    }

    // التحقق من توفر المنتج والكمية
    await Cart.validateCartItem(Product_ID, Quantity);

    await Cart.addToCart(Customer_ID, Product_ID, Quantity);
    const cartItems = await Cart.getCart(Customer_ID);

    Logger.info('Product added to cart', { Customer_ID, Product_ID, Quantity });
    return ApiResponse.success(res, { cart_items: cartItems }, 'تم إضافة المنتج إلى السلة بنجاح');
  } catch (err) {
    Logger.error('Add to cart error', err);
    return ApiResponse.error(res, err.message || 'فشل في إضافة المنتج إلى السلة', 400);
  }
};

/**
 * تحديث كمية منتج في السلة
 */
const updateProduct = async (req, res) => {
  try {
    const Customer_ID = req.session.userId;
    if (!Customer_ID) {
      return ApiResponse.unauthorized(res);
    }

    const { Product_ID, Quantity } = req.body;

    if (!Product_ID || !Quantity) {
      return ApiResponse.validationError(res, null, 'معرف المنتج والكمية مطلوبان');
    }

    if (Quantity <= 0) {
      return ApiResponse.validationError(res, null, 'الكمية يجب أن تكون أكبر من 0');
    }

    // التحقق من توفر الكمية
    await Cart.validateCartItem(Product_ID, Quantity);

    await Cart.updateCart(Customer_ID, Product_ID, Quantity);
    const cartItems = await Cart.getCart(Customer_ID);

    Logger.info('Cart item updated', { Customer_ID, Product_ID, Quantity });
    return ApiResponse.success(res, { cart_items: cartItems }, 'تم تحديث السلة بنجاح');
  } catch (err) {
    Logger.error('Update cart error', err);
    return ApiResponse.error(res, err.message || 'فشل في تحديث السلة', 400);
  }
};

/**
 * حذف منتج من السلة
 */
const removeProduct = async (req, res) => {
  try {
    const Customer_ID = req.session.userId;
    if (!Customer_ID) {
      return ApiResponse.unauthorized(res);
    }

    const { Product_ID } = req.body;

    if (!Product_ID) {
      return ApiResponse.validationError(res, null, 'معرف المنتج مطلوب');
    }

    await Cart.removeFromCart(Customer_ID, Product_ID);
    const cartItems = await Cart.getCart(Customer_ID);

    Logger.info('Product removed from cart', { Customer_ID, Product_ID });
    return ApiResponse.success(res, { cart_items: cartItems }, 'تم حذف المنتج من السلة بنجاح');
  } catch (err) {
    Logger.error('Remove from cart error', err);
    return ApiResponse.error(res, err.message || 'فشل في حذف المنتج من السلة', 500);
  }
};

/**
 * الحصول على محتويات السلة
 */
const getCartItems = async (req, res) => {
  try {
    const Customer_ID = req.session.userId;
    if (!Customer_ID) {
      return ApiResponse.unauthorized(res);
    }

    const cartItems = await Cart.getCart(Customer_ID);
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.Quantity), 0);

    return ApiResponse.success(res, {
      cart_items: cartItems,
      total: total,
      item_count: cartItems.length
    }, 'تم جلب السلة بنجاح');
  } catch (err) {
    Logger.error('Get cart error', err);
    return ApiResponse.error(res, 'فشل في جلب السلة', 500);
  }
};

module.exports = { addProduct, updateProduct, removeProduct, getCartItems };