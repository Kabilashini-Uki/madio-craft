const express = require('express');
const router = express.Router();
const { 
  createProduct, 
  getProducts, 
  getProduct, 
  updateProduct, 
  deleteProduct,
  addReview 
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected routes
router.post('/', protect, authorize('artisan'), uploadMultiple, createProduct);
router.put('/:id', protect, authorize('artisan'), uploadMultiple, updateProduct);
router.delete('/:id', protect, authorize('artisan', 'admin'), deleteProduct);
router.post('/:id/reviews', protect, authorize('buyer'), addReview);

module.exports = router;