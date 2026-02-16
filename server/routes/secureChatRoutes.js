// server/routes/secureChatRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { ChatRoom, Message } = require('../models/ChatRoom');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Create or get customization room
router.post('/customization/room', protect, async (req, res) => {
  try {
    const { artisanId, productId, customizationData } = req.body;
    const buyerId = req.user.id;

    console.log('Creating customization room:', { buyerId, artisanId, productId });

    // For development with mock data, accept string IDs
    // In production, you'd want to validate ObjectIds
    
    // Check if users exist (for mock data, skip validation)
    let product = null;
    if (productId && productId !== 'null' && productId !== 'undefined') {
      try {
        if (isValidObjectId(productId)) {
          product = await Product.findById(productId);
        }
      } catch (e) {
        console.log('Product not found in DB, using mock data');
      }
    }

    // Check for existing room - handle both ObjectId and string IDs
    let room = null;
    
    try {
      // Try to find with ObjectIds first
      if (isValidObjectId(buyerId) && isValidObjectId(artisanId)) {
        room = await ChatRoom.findOne({
          participants: { $all: [buyerId, artisanId] },
          ...(productId && productId !== 'null' && { product: productId }),
          type: 'customization',
          isActive: true
        });
      }
    } catch (e) {
      console.log('Error finding room with ObjectIds, trying with strings');
    }

    // If not found, try with string comparison
    if (!room) {
      const allRooms = await ChatRoom.find({
        type: 'customization',
        isActive: true
      });
      
      room = allRooms.find(r => {
        const participants = r.participants.map(p => p.toString());
        return participants.includes(buyerId.toString()) && 
               participants.includes(artisanId.toString()) &&
               (!productId || r.product?.toString() === productId.toString());
      });
    }

    if (!room) {
      // Create new room with mixed ID types
      room = new ChatRoom({
        participants: [buyerId, artisanId],
        product: productId && productId !== 'null' ? productId : null,
        type: 'customization',
        customizationData: customizationData || {},
        customizationStatus: 'draft',
        createdBy: buyerId,
        unreadCount: new Map([[artisanId.toString(), 1]])
      });
      
      await room.save();
      console.log('New room created:', room._id);
    } else {
      console.log('Existing room found:', room._id);
    }

    // Try to populate if using ObjectIds
    try {
      if (isValidObjectId(room.participants[0])) {
        await room.populate('participants', 'name avatar');
      }
      if (room.product && isValidObjectId(room.product)) {
        await room.populate('product', 'name images price');
      }
    } catch (e) {
      console.log('Population failed, using raw IDs');
    }

    res.json({
      success: true,
      room,
      customization: {
        _id: room._id,
        ...(customizationData || {}),
        status: room.customizationStatus
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Verify room access
router.get('/rooms/:roomId/verify', protect, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    
    if (!room) {
      return res.json({ hasAccess: false });
    }

    // Check if user is participant (handle both ObjectId and string)
    const hasAccess = room.participants.some(
      p => p.toString() === req.user.id.toString()
    );

    res.json({ hasAccess });
  } catch (error) {
    console.error('Verify error:', error);
    res.json({ hasAccess: false });
  }
});

// Get room messages
router.get('/rooms/:roomId/messages', protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify access
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const hasAccess = room.participants.some(
      p => p.toString() === req.user.id.toString()
    );
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({ chatRoom: roomId })
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Add sender info (for mock data)
    const messagesWithSender = messages.map(msg => ({
      ...msg,
      senderName: msg.sender === req.user.id ? 'You' : 'Artisan'
    }));

    // Mark messages as read
    await Message.updateMany(
      { 
        chatRoom: roomId, 
        sender: { $ne: req.user.id },
        isRead: false 
      },
      { $set: { isRead: true } }
    );

    // Update unread count
    if (room.unreadCount && room.unreadCount.has(req.user.id.toString())) {
      room.unreadCount.set(req.user.id.toString(), 0);
      await room.save();
    }

    res.json({
      success: true,
      messages: messagesWithSender.reverse()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/messages', protect, async (req, res) => {
  try {
    const { roomId, message, type = 'text', fileUrl } = req.body;

    // Verify access
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const hasAccess = room.participants.some(
      p => p.toString() === req.user.id.toString()
    );
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create message
    const newMessage = await Message.create({
      chatRoom: roomId,
      sender: req.user.id,
      message,
      type,
      fileUrl
    });

    // Update room's last message
    room.lastMessage = {
      sender: req.user.id,
      message,
      type,
      createdAt: new Date()
    };

    // Update unread count for other participants
    room.participants.forEach(participantId => {
      if (participantId.toString() !== req.user.id.toString()) {
        const currentCount = room.unreadCount?.get(participantId.toString()) || 0;
        if (!room.unreadCount) room.unreadCount = new Map();
        room.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });

    await room.save();

    const messageObj = newMessage.toObject();
    messageObj.senderName = 'You';
    messageObj.isOwn = true;

    // Emit via socket
    const io = req.app.get('io');
    io.to(roomId).emit('receive-message', {
      ...messageObj,
      roomId,
      senderName: 'Artisan', // For other participants
      isOwn: false
    });

    res.json({
      success: true,
      message: messageObj
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update customization
router.put('/customization/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const room = await ChatRoom.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const hasAccess = room.participants.some(
      p => p.toString() === req.user.id.toString()
    );
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    room.customizationData = { ...room.customizationData, ...updates };
    if (updates.status) {
      room.customizationStatus = updates.status;
    }
    await room.save();

    res.json({
      success: true,
      customization: room.customizationData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's chat rooms
router.get('/rooms', protect, async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      participants: req.user.id,
      isActive: true
    })
    .sort('-updatedAt');

    // Add mock data for development
    const roomsWithDetails = rooms.map(room => ({
      ...room.toObject(),
      participants: room.participants.map(p => ({
        _id: p,
        name: p === req.user.id ? 'You' : 'Artisan',
        avatar: null
      }))
    }));

    res.json({
      success: true,
      rooms: roomsWithDetails
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;