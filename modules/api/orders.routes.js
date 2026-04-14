const express = require('express');
const router = express.Router();
const orderController = require('../../modules/customer/order.controller');
const kitchenController = require('../../modules/kitchen/kitchen.controller');

// Public API: create order (customer)
router.post('/orders', orderController.createOrder);

// Chef API: orders for kitchen (expecting auth to be handled upstream)
router.get('/orders/chef', kitchenController.getKitchenOrders);

// Dashboard summary for admin
router.get('/orders/dashboard', orderController.dashboardSummary);

// Update order status
router.patch('/orders/:id/status', orderController.updateOrderStatus);

module.exports = router;
