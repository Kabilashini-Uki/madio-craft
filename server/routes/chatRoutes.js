// routes/chatRoutes.js
import { Router } from 'express';
import {
  createCustomizationRoom, getUserRooms, getRoomMessages,
  sendMessage, getOrCreateRoom, sendMessageWithSocket,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.post('/room', getOrCreateRoom);
router.post('/customization/room', createCustomizationRoom);
router.get('/rooms', getUserRooms);
router.get('/rooms/:roomId/verify', async (req, res) => {
  try {
    const { ChatRoom } = await import('../models/ChatRoom.js');
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) return res.json({ hasAccess: false });
    const hasAccess = room.participants.some(p => String(p) === String(req.user.id));
    res.json({ hasAccess });
  } catch { res.json({ hasAccess: false }); }
});
router.get('/rooms/:roomId/messages', getRoomMessages);
router.post('/messages', sendMessageWithSocket);  // primary send endpoint
router.post('/message', sendMessage);            // legacy fallback

// POST /api/chat/request-response — artisan responds to a message-based custom request
router.post('/request-response', async (req, res) => {
  try {
    const { buyerId, available, roomId } = req.body;
    const artisanId = req.user.id;
    const artisanName = req.user.name;
    const io = req.app.get('io');
    const actualBuyerId = String(buyerId);

    // 5. Create persistent notification for the buyer
    try {
      const { default: Notification } = await import('../models/Notification.js');
      await Notification.create({
        user: actualBuyerId,
        userModel: 'User',
        type: 'customization-response',
        title: available ? 'Customisation Accepted!' : 'Customisation Unavailable',
        body: available
          ? `${artisanName || 'The artisan'} accepted your message-based customisation request.`
          : `${artisanName || 'The artisan'} cannot fulfil your request at this time.`,
        data: {
          requestId: roomId,
          roomId,
          artisan: { id: artisanId, name: artisanName },
          available,
          status: available ? 'accepted' : 'rejected',
          isChatRequest: true,
        }
      });
    } catch (err) {
      console.warn('Chat response notification failed:', err.message);
    }

    if (io && buyerId) {
      io.to(`user-${actualBuyerId}`).emit('customization-response', {
        requestId: roomId,
        productId: null,
        productName: 'your message',
        artisan: { id: artisanId, name: artisanName },
        available,
        status: available ? 'accepted' : 'rejected',
        timestamp: new Date(),
        roomId,
        isChatRequest: true,
      });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('chat request-response error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
