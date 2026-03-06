// routes/orderRoutes.js
import { Router } from 'express';
import {
  createOrder, getMyOrders, getOrder,
  getArtisanOrders, updateOrderStatus, cancelOrder,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/artisan-orders', authorize('artisan','admin'), getArtisanOrders);
router.get('/:id', getOrder);
router.put('/:id/status', authorize('artisan','admin'), updateOrderStatus);
router.put('/:id/cancel', cancelOrder);

export default router;
