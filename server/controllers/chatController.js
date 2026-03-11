// controllers/chatController.js
import { ChatRoom, Message } from '../models/ChatRoom.js';
import User from '../models/User.js';

// POST /api/chat/customization/room
// Buyer starts a customization chat with a specific artisan.
// Creates or reuses an existing customization room and notifies the artisan via socket.
export const createCustomizationRoom = async (req, res) => {
  try {
    const { artisanId, productId, customizationData = {} } = req.body;
    const buyerId = req.user.id;

    // Validate artisan exists
    const artisan = await User.findById(artisanId).select('name role');
    if (!artisan || artisan.role !== 'artisan') {
      return res.status(404).json({ message: 'Artisan not found' });
    }

    // Reuse an existing active customization room between this buyer & artisan
    let room = await ChatRoom.findOne({
      participants: { $all: [buyerId, artisanId] },
      type: 'customization',
      isActive: true,
      ...(productId ? { product: productId } : {}),
    });

    if (!room) {
      room = await ChatRoom.create({
        participants: [buyerId, artisanId],
        product: productId || null,
        type: 'customization',
        customizationData,
        customizationStatus: 'pending',
        createdBy: buyerId,
      });
    }

    // Populate for response
    await room.populate('participants', 'name avatar role');

    // Notify the artisan in real time
    try {
      const io = req.app.get('io');
      const buyer = await User.findById(buyerId).select('name');
      if (io) {
        io.to(`user-${artisanId}`).emit('new-customization-request', {
          message: `New customization request from ${buyer?.name || 'a buyer'}`,
          roomId: room._id,
          buyerName: buyer?.name || 'Buyer',
          productId,
        });
      }
    } catch (e) {
      console.warn('Socket notify failed:', e.message);
    }

    res.json({ success: true, room });
  } catch (error) {
    console.error('Create customization room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



export const getUserRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ participants: req.user.id, isActive: true })
      .populate('participants', 'name avatar role')
      .populate('product', 'name images')
      .populate('order')
      .sort('-updatedAt');

    res.json({ success: true, rooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const room = await ChatRoom.findById(roomId);
    if (!room.participants.includes(req.user.id)) return res.status(403).json({ message: 'Not authorized' });

    const messages = await Message.find({ chatRoom: roomId })
      .populate('sender', 'name avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .lean();

    await Message.updateMany({ chatRoom: roomId, sender: { $ne: req.user.id }, isRead: false }, { $set: { isRead: true } });

    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { roomId, message, type = 'text', fileUrl } = req.body;

    const room = await ChatRoom.findById(roomId);
    if (!room.participants.includes(req.user.id)) return res.status(403).json({ message: 'Not authorized' });

    const newMessage = await Message.create({ chatRoom: roomId, sender: req.user.id, message, type, fileUrl });

    room.lastMessage = { sender: req.user.id, message, type, createdAt: new Date() };
    room.participants.forEach((participantId) => {
      if (participantId.toString() !== req.user.id.toString()) {
        const currentCount = room.unreadCount.get(participantId.toString()) || 0;
        room.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });
    await room.save();

    const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name avatar');
    res.json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/chat/room — get or create a chat room between buyer & artisan
export const getOrCreateRoom = async (req, res) => {
  try {
    const { artisanId, productId } = req.body;
    const buyerId = req.user.id;

    const artisan = await User.findById(artisanId).select('name role');
    if (!artisan) return res.status(404).json({ message: 'Artisan not found' });

    // Try to find existing room
    let room = await ChatRoom.findOne({
      participants: { $all: [buyerId, artisanId] },
      isActive: true,
      ...(productId ? { product: productId } : {}),
    });

    if (!room) {
      room = await ChatRoom.create({
        participants: [buyerId, artisanId],
        product: productId || null,
        type: 'order',
        createdBy: buyerId,
      });
    }

    await room.populate('participants', 'name avatar role');

    // Notify artisan of new chat
    try {
      const io = req.app.get('io');
      const buyer = await User.findById(buyerId).select('name');
      if (io) {
        io.to(`user-${artisanId}`).emit('new-chat-started', {
          message: `${buyer?.name || 'A buyer'} started a chat with you`,
          roomId: room._id,
          buyerName: buyer?.name,
        });
      }
    } catch (e) {}

    res.json({ success: true, room });
  } catch (error) {
    console.error('getOrCreateRoom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/chat/messages — send + emit via socket
export const sendMessageWithSocket = async (req, res) => {
  try {
    const { roomId, message, type = 'text', fileUrl } = req.body;

    const room = await ChatRoom.findById(roomId).populate('participants', 'name avatar role');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (!room.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const newMessage = await Message.create({ chatRoom: roomId, sender: req.user.id, message, type, fileUrl });

    room.lastMessage = { sender: req.user.id, message, type, createdAt: new Date() };
    room.participants.forEach((p) => {
      if (p._id.toString() !== req.user.id) {
        const cur = room.unreadCount.get(p._id.toString()) || 0;
        room.unreadCount.set(p._id.toString(), cur + 1);
      }
    });
    await room.save();

    const populated = await Message.findById(newMessage._id).populate('sender', 'name avatar');

    // Emit to room via socket
    try {
      const io = req.app?.get?.('io');
      if (io) {
        const msgPayload = {
          _id: String(populated._id),
          roomId: String(roomId),
          message: populated.message,
          sender: String(req.user.id),
          senderName: populated.sender?.name,
          timestamp: populated.createdAt,
          type: populated.type,
        };
        // Broadcast to everyone in the room (including sender on other devices)
        io.to(String(roomId)).emit('receive-message', msgPayload);

        // Personal notification to the other participant(s)
        room.participants.forEach(p => {
          const pid = String(p._id || p);
          if (pid !== String(req.user.id)) {
            io.to(`user-${pid}`).emit('new-message-notification', {
              roomId: String(roomId),
              message: (message || '').substring(0, 80),
              senderName: populated.sender?.name,
            });
          }
        });
      }
    } catch (e) { console.warn('Socket emit error:', e.message); }

    res.json({ success: true, message: populated });
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
