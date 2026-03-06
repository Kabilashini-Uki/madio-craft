// routes/admin.js
import { Router } from 'express';
import {
  getStats, getUsers, getProducts, getOrders,
  verifyArtisan, suspendUser, deleteUser,
  updateProductStatus, deleteProduct,
  updateOrderStatus, refundOrder,
  loginAsUser, getArtisanStats,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/stats',                    getStats);
router.get('/users',                    getUsers);
router.get('/products',                 getProducts);
router.get('/orders',                   getOrders);

router.put('/users/:id/verify',         verifyArtisan);
router.put('/users/:id/suspend',        suspendUser);
router.delete('/users/:id',             deleteUser);

router.put('/products/:id/status',      updateProductStatus);
router.delete('/products/:id',          deleteProduct);

router.put('/orders/:id/status',        updateOrderStatus);
router.post('/orders/:id/refund',       refundOrder);

router.post('/login-as/:userId',        loginAsUser);
router.get('/artisans/:id/stats',       getArtisanStats);

export default router;
