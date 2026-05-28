/**
 * Review Controller
 * معالجة منطق التقييمات
 */

const Review = require('./review.model');
const ApiResponse = require('../../core/utils/response');
const Logger = require('../../core/utils/logger');

/**
 * إنشاء تقييم جديد
 */
exports.createReview = async (req, res) => {
  try {
    const customerId = req.session.userId;
    const { productId, rating, comment } = req.body;

    if (!customerId) {
      return ApiResponse.unauthorized(res);
    }

    const reviewId = await Review.create(customerId, productId, rating, comment);
    Logger.audit('REVIEW_CREATED', customerId, { reviewId, productId, rating });

    return ApiResponse.success(res, { reviewId }, 'تم إضافة التقييم بنجاح', 201);
  } catch (error) {
    Logger.error('Create review error', error);
    return ApiResponse.error(res, error.message || 'فشل في إضافة التقييم', 400);
  }
};

/**
 * الحصول على تقييمات منتج
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const reviews = await Review.getProductReviews(productId, limit, offset);
    const ratingStats = await Review.getAverageRating(productId);

    return ApiResponse.success(res, {
      reviews,
      stats: ratingStats
    }, 'تم جلب التقييمات بنجاح');
  } catch (error) {
    Logger.error('Get reviews error', error);
    return ApiResponse.error(res, 'فشل في جلب التقييمات', 500);
  }
};

/**
 * تحديث تقييم
 */
exports.updateReview = async (req, res) => {
  try {
    const customerId = req.session.userId;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!customerId) {
      return ApiResponse.unauthorized(res);
    }

    await Review.update(reviewId, customerId, rating, comment);
    Logger.audit('REVIEW_UPDATED', customerId, { reviewId });

    return ApiResponse.success(res, null, 'تم تحديث التقييم بنجاح');
  } catch (error) {
    Logger.error('Update review error', error);
    return ApiResponse.error(res, error.message || 'فشل في تحديث التقييم', 400);
  }
};

/**
 * حذف تقييم
 */
exports.deleteReview = async (req, res) => {
  try {
    const customerId = req.session.userId;
    const { reviewId } = req.params;

    if (!customerId) {
      return ApiResponse.unauthorized(res);
    }

    await Review.delete(reviewId, customerId);
    Logger.audit('REVIEW_DELETED', customerId, { reviewId });

    return ApiResponse.success(res, null, 'تم حذف التقييم بنجاح');
  } catch (error) {
    Logger.error('Delete review error', error);
    return ApiResponse.error(res, error.message || 'فشل في حذف التقييم', 400);
  }
};

/**
 * الحصول على تقييمات العميل
 */
exports.getCustomerReviews = async (req, res) => {
  try {
    const customerId = req.session.userId;
    if (!customerId) {
      return ApiResponse.unauthorized(res);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const reviews = await Review.getCustomerReviews(customerId, limit, offset);
    return ApiResponse.success(res, reviews, 'تم جلب تقييماتك بنجاح');
  } catch (error) {
    Logger.error('Get customer reviews error', error);
    return ApiResponse.error(res, 'فشل في جلب التقييمات', 500);
  }
};



