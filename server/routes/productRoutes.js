// routes/productRoutes.js
import { Router }             from 'express';
import {
  createProduct, getProducts, getProduct,
  updateProduct, deleteProduct, addReview,
  getMyProducts, getCategoryCounts,
}                             from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadProductImages } from '../middleware/upload.js';

const router = Router();

router.get('/',               getProducts);
router.get('/category-counts',getCategoryCounts);
router.get('/my',             protect, authorize('artisan'), getMyProducts);
router.get('/:id',            getProduct);

router.post('/',              protect, authorize('artisan'), uploadProductImages, createProduct);
router.put('/:id',            protect, authorize('artisan'), uploadProductImages, updateProduct);
router.delete('/:id',         protect, authorize('artisan', 'admin'), deleteProduct);
router.post('/:id/reviews',   protect, addReview);

export default router;
