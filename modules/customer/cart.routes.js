/**
 * Cart Routes
 * مسارات السلة
 */
const express = require('express');
const cartController = require('./cart.controller');
const { requireCustomer } = require('../../core/middlewares/authMiddleware');
const { validateCartItem } = require('../../core/middlewares/validator');

const router = express.Router();

// إضافة منتج إلى السلة
router.post('/cart/add', requireCustomer, validateCartItem, cartController.addProduct);

// تحديث كمية منتج في السلة
router.put('/cart/update', requireCustomer, validateCartItem, cartController.updateProduct);

// حذف منتج من السلة
router.delete('/cart/remove', requireCustomer, cartController.removeProduct);

// الحصول على محتويات السلة
router.get('/cart', requireCustomer, cartController.getCartItems);

module.exports = router;