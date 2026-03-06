// routes/chatRoutes.js
import { Router } from 'express';
import {
  createCustomizationRoom,
  getUserRooms,
  getRoomMessages, sendMessage,
  getOrCreateRoom,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/room', getOrCreateRoom);
router.post('/customization/room', createCustomizationRoom); // Buyer starts customization request → notifies artisan
router.get('/rooms', getUserRooms);
router.get('/rooms/:roomId/messages', getRoomMessages);
router.post('/message', sendMessage);

export default router;

