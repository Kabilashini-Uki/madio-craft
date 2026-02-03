const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  verifyPayment, 
  getMyOrders, 
  getArtisanOrders,
  updateOrderStatus,
  test
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Test route
router.get('/test', test);

// Protected routes
router.post('/', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);
router.get('/my-orders', protect, getMyOrders);
router.get('/artisan-orders', protect, authorize('artisan'), getArtisanOrders);
router.put('/:id/status', protect, authorize('artisan'), updateOrderStatus);

module.exports = router;