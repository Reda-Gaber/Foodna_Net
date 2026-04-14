/**
 * Coupon Routes (Admin)
 * مسارات الكوبونات
 */

const express = require('express');
const couponController = require('./coupon.controller');
const { requireEmployee } = require('../../core/middlewares/authMiddleware');

const router = express.Router();

// جميع المسارات تتطلب تسجيل دخول كموظف
router.use(requireEmployee);

// إنشاء كوبون جديد
router.post('/coupons', couponController.createCoupon);

// التحقق من صحة الكوبون (متاح للعملاء أيضاً)
router.post('/coupons/validate', couponController.validateCoupon);

// الحصول على جميع الكوبونات
router.get('/coupons', couponController.getAllCoupons);

// الحصول على كوبون معين
router.get('/coupons/:id', couponController.getCouponById);

// تحديث كوبون
router.put('/coupons/:id', couponController.updateCoupon);

// حذف كوبون
router.delete('/coupons/:id', couponController.deleteCoupon);

module.exports = router;



