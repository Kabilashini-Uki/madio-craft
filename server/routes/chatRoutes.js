const express = require('express');
const router = express.Router();
const { 
  getOrCreateRoom, 
  getUserRooms, 
  getRoomMessages, 
  sendMessage 
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.post('/room', protect, getOrCreateRoom);
router.get('/rooms', protect, getUserRooms);
router.get('/rooms/:roomId/messages', protect, getRoomMessages);
router.post('/messages', protect, sendMessage);

module.exports = router;