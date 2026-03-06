// routes/cartRoutes.js
import { Router } from 'express';
import {
  getCart, addToCart, updateQuantity, removeFromCart, clearCart,
  applyCoupon, removeCoupon, updateShippingZone, updateDeliveryMethod,
} from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update/:itemId', updateQuantity);
router.delete('/remove/:itemId', removeFromCart);
router.delete('/', clearCart);
router.post('/coupon', applyCoupon);
router.delete('/coupon', removeCoupon);
router.put('/shipping-zone', updateShippingZone);
router.put('/delivery-method', updateDeliveryMethod);

export default router;
