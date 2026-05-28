/**
 * Review Routes
 * مسارات التقييمات
 */

const express = require('express');
const reviewController = require('./review.controller');
const { requireCustomer } = require('../../core/middlewares/authMiddleware');
const { validateReview, validateId } = require('../../core/middlewares/validator');

const router = express.Router();

// الحصول على تقييمات منتج (متاح للجميع)
router.get('/products/:productId/reviews', validateId, reviewController.getProductReviews);

// جميع المسارات الأخرى تتطلب تسجيل دخول
router.use(requireCustomer);

// إنشاء تقييم
router.post('/reviews', validateReview, reviewController.createReview);

// تحديث تقييم
router.put('/reviews/:reviewId', validateId, validateReview, reviewController.updateReview);

// حذف تقييم
router.delete('/reviews/:reviewId', validateId, reviewController.deleteReview);

// الحصول على تقييمات العميل
router.get('/reviews', reviewController.getCustomerReviews);

module.exports = router;



