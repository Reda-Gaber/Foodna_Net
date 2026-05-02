/**
 * Coupon Routes (Admin)
 * مسارات الكوبونات
 */

const express = require('express');
const couponController = require('./coupon.controller');
const { requireEmployee } = require('../../core/middlewares/authMiddleware');

const router = express.Router();

// ✅ Public endpoint — العميل يقدر يتحقق من الكوبون بدون login
router.post('/coupons/validate', couponController.validateCoupon);

// جميع المسارات التالية تتطلب تسجيل دخول كموظف
router.use(requireEmployee);

// إنشاء كوبون جديد
router.post('/coupons', couponController.createCoupon);

// الحصول على جميع الكوبونات
router.get('/coupons', couponController.getAllCoupons);

// الحصول على كوبون معين
router.get('/coupons/:id', couponController.getCouponById);

// تحديث كوبون
router.put('/coupons/:id', couponController.updateCoupon);

// حذف كوبون
router.delete('/coupons/:id', couponController.deleteCoupon);

module.exports = router;