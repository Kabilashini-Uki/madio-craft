// routes/productRoutes.js
import { Router } from 'express';
import {
  createProduct, getProducts, getProduct,
  updateProduct, deleteProduct,
  getMyProducts, getCategoryCounts, getCategories,
  sendCustomizationRequest, respondToCustomization,
  getCustomizationRequests, getMyCustomizationRequests,
  getCustomizationRequest,
  uploadImages,
} from '../controllers/productController.js';
import { protect, authorize, artisanAccess } from '../middleware/auth.js';
import { uploadProductImages } from '../middleware/upload.js';

const router = Router();


/** Middleware: allow buyers, or artisans ordering from other shops */
const canSendCustomization = (req, res, next) => {
  if (!req.user || (req.user.role !== 'buyer' && req.user.role !== 'artisan')) {
    return res.status(403).json({ message: 'Only buyers and artisans can send customization requests' });
  }
  next();
};

// ── Static / named routes MUST come before /:id ──────────────────
router.get('/', getProducts);
router.get('/counts', getCategoryCounts);
router.get('/category-counts', getCategoryCounts);
router.get('/categories', getCategories);
router.get('/my', protect, artisanAccess, getMyProducts);

// Image upload endpoint
router.post('/upload-images', protect, artisanAccess, uploadProductImages, uploadImages);

// Customization request queries
router.get('/customization-requests', protect, artisanAccess, getCustomizationRequests);
router.get('/my-customization-requests', protect, getMyCustomizationRequests);
router.get('/customization-request/:id', protect, getCustomizationRequest);

// ── Dynamic id route ─────────────────────────────────────────────
router.get('/:id', getProduct);

router.post('/', protect, artisanAccess, uploadProductImages, createProduct);
router.put('/:id', protect, artisanAccess, uploadProductImages, updateProduct);
router.delete('/:id', protect, artisanAccess, deleteProduct);

router.post('/:id/customization-request', protect, sendCustomizationRequest);
router.post('/:id/customization-response', protect, artisanAccess, respondToCustomization);

export default router;