// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  verifyPayment, 
  getMyOrders, 
  getArtisanOrders,
  updateOrderStatus,
  getOrder,
  cancelOrder,
  test
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Test route (must be before /:id)
router.get('/test', test);

// Specific named routes (before param routes)
router.get('/my-orders', protect, getMyOrders);
router.get('/artisan-orders', protect, authorize('artisan', 'admin'), getArtisanOrders);
router.post('/verify-payment', protect, verifyPayment);

// Main CRUD
router.post('/', protect, createOrder);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, authorize('artisan', 'admin'), updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;
