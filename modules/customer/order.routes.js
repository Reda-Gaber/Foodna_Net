/**
 * Order Routes
 * مسارات الطلبات
 */

const express = require('express');
const orderController = require('./order.controller');
const { requireCustomer } = require('../../core/middlewares/authMiddleware');
const { validateOrder } = require('../../core/middlewares/validator');

const router = express.Router();

// إنشاء طلب جديد
router.post('/orders', requireCustomer, validateOrder, orderController.createOrder);

// الحصول على طلبات العميل
router.get('/orders', requireCustomer, orderController.getOrders);

// الحصول على تفاصيل طلب معين
router.get('/orders/:orderId', requireCustomer, orderController.getOrderDetails);

// إلغاء طلب
router.delete('/orders/:orderId', requireCustomer, orderController.cancelOrder);

module.exports = router;



