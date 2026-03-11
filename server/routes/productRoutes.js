// routes/productRoutes.js
import { Router }             from 'express';
import {
  createProduct, getProducts, getProduct,
  updateProduct, deleteProduct, addReview,
  getMyProducts, getCategoryCounts,
  sendCustomizationRequest, respondToCustomization,
  getCustomizationRequests, getMyCustomizationRequests,
}                             from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadProductImages } from '../middleware/upload.js';

const router = Router();

/** Middleware: allow if the user's BASE role is artisan (regardless of activeRole) */
const artisanBaseRole = (req, res, next) => {
  if (!req.user || req.user.role !== 'artisan') {
    return res.status(403).json({ message: 'Only artisans can access this route' });
  }
  next();
};

/** Middleware: allow buyers, or artisans who have switched to buyer mode */
const canSendCustomization = (req, res, next) => {
  const effectiveRole = req.user?.activeRole || req.user?.role;
  if (!req.user || (effectiveRole !== 'buyer' && req.user.role !== 'buyer')) {
    return res.status(403).json({ message: 'Only buyers can send customization requests' });
  }
  next();
};

// ── Static / named routes MUST come before /:id ──────────────────
router.get('/',                getProducts);
router.get('/counts',          getCategoryCounts);
router.get('/category-counts', getCategoryCounts);
router.get('/my',              protect, artisanBaseRole, getMyProducts);

// Customization request queries
router.get('/customization-requests',    protect, artisanBaseRole,      getCustomizationRequests);
router.get('/my-customization-requests', protect, authorize('buyer'),   getMyCustomizationRequests);

// ── Dynamic id route ─────────────────────────────────────────────
router.get('/:id',             getProduct);

router.post('/',               protect, artisanBaseRole, uploadProductImages, createProduct);
router.put('/:id',             protect, artisanBaseRole, uploadProductImages, updateProduct);
router.delete('/:id',          protect, authorize('artisan', 'admin'), deleteProduct);
router.post('/:id/reviews',    protect, addReview);
router.post('/:id/customization-request',  protect, sendCustomizationRequest);
router.post('/:id/customization-response', protect, artisanBaseRole, respondToCustomization);

export default router;