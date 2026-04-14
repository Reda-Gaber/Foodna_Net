/**
 * Coupon Controller
 * معالجة منطق الكوبونات
 */

const Coupon = require('./coupon.model');
const ApiResponse = require('../../core/utils/response');
const Logger = require('../../core/utils/logger');

/**
 * إنشاء كوبون جديد
 */
exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minPurchase, maxDiscount, expiryDate, usageLimit, isActive } = req.body;

    if (!code || !discountType || !discountValue || !expiryDate) {
      return ApiResponse.validationError(res, null, 'البيانات المطلوبة: code, discountType, discountValue, expiryDate');
    }

    if (discountType !== 'percentage' && discountType !== 'fixed') {
      return ApiResponse.validationError(res, null, 'نوع الخصم يجب أن يكون percentage أو fixed');
    }

    const couponId = await Coupon.create({
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      expiryDate,
      usageLimit,
      isActive
    });

    Logger.audit('COUPON_CREATED', req.session.user?.id, { couponId, code });
    return ApiResponse.success(res, { couponId }, 'تم إنشاء الكوبون بنجاح', 201);
  } catch (error) {
    Logger.error('Create coupon error', error);
    return ApiResponse.error(res, error.message || 'فشل في إنشاء الكوبون', 500);
  }
};

/**
 * التحقق من صحة الكوبون
 */
exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const { totalAmount } = req.body;

    if (!code) {
      return ApiResponse.validationError(res, null, 'كود الكوبون مطلوب');
    }

    const coupon = await Coupon.validateCoupon(code);

    if (!coupon) {
      return ApiResponse.error(res, 'الكوبون غير صالح أو منتهي الصلاحية', 400);
    }

    if (totalAmount) {
      const discount = Coupon.calculateDiscount(coupon, totalAmount);
      return ApiResponse.success(res, { coupon, discount }, 'الكوبون صالح');
    }

    return ApiResponse.success(res, { coupon }, 'الكوبون صالح');
  } catch (error) {
    Logger.error('Validate coupon error', error);
    return ApiResponse.error(res, error.message || 'فشل في التحقق من الكوبون', 400);
  }
};

/**
 * الحصول على جميع الكوبونات
 */
exports.getAllCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const coupons = await Coupon.getAll(limit, offset);
    return ApiResponse.success(res, coupons, 'تم جلب الكوبونات بنجاح');
  } catch (error) {
    Logger.error('Get coupons error', error);
    return ApiResponse.error(res, 'فشل في جلب الكوبونات', 500);
  }
};

/**
 * الحصول على كوبون معين
 */
exports.getCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return ApiResponse.notFound(res, 'الكوبون غير موجود');
    }

    return ApiResponse.success(res, coupon, 'تم جلب الكوبون بنجاح');
  } catch (error) {
    Logger.error('Get coupon error', error);
    return ApiResponse.error(res, 'فشل في جلب الكوبون', 500);
  }
};

/**
 * تحديث كوبون
 */
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const affectedRows = await Coupon.update(id, req.body);

    if (affectedRows === 0) {
      return ApiResponse.notFound(res, 'الكوبون غير موجود');
    }

    Logger.audit('COUPON_UPDATED', req.session.user?.id, { couponId: id });
    return ApiResponse.success(res, null, 'تم تحديث الكوبون بنجاح');
  } catch (error) {
    Logger.error('Update coupon error', error);
    return ApiResponse.error(res, error.message || 'فشل في تحديث الكوبون', 500);
  }
};

/**
 * حذف كوبون
 */
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const affectedRows = await Coupon.delete(id);

    if (affectedRows === 0) {
      return ApiResponse.notFound(res, 'الكوبون غير موجود');
    }

    Logger.audit('COUPON_DELETED', req.session.user?.id, { couponId: id });
    return ApiResponse.success(res, null, 'تم حذف الكوبون بنجاح');
  } catch (error) {
    Logger.error('Delete coupon error', error);
    return ApiResponse.error(res, 'فشل في حذف الكوبون', 500);
  }
};



