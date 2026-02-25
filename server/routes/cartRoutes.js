const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// All cart routes require authentication
router.use(protect);

// Get cart
router.get('/', getCart);

// Add to cart
router.post('/add', addToCart);

// Update quantity
router.put('/update/:itemId', updateQuantity);

// Remove from cart
router.delete('/remove/:itemId', removeFromCart);

// Clear cart
router.delete('/clear', clearCart);

// Apply coupon
router.post('/apply-coupon', applyCoupon);

// Remove coupon
router.delete('/remove-coupon', removeCoupon);

module.exports = router;
