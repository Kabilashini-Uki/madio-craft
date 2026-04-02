// routes/orderRoutes.js
import { Router } from 'express';
import {
  createOrder, getMyOrders, getOrder,
  getArtisanOrders, updateOrderStatus, cancelOrder,
  confirmReceived, confirmPayment
} from '../controllers/orderController.js';
import { protect, authorize, artisanAccess } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/artisan-orders', artisanAccess, getArtisanOrders);
router.get('/:id', getOrder);
router.put('/:id/status', artisanAccess, updateOrderStatus);
router.put('/:id/cancel', cancelOrder);
router.post('/:id/confirm-received', confirmReceived);
router.post('/:id/confirm-payment', artisanAccess, confirmPayment);

export default router;
