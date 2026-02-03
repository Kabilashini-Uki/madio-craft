const { ChatRoom, Message } = require('../models/ChatRoom');

// @desc    Get or create chat room
// @route   POST /api/chat/room
// @access  Private
exports.getOrCreateRoom = async (req, res) => {
  try {
    const { artisanId, productId } = req.body;
    const buyerId = req.user.id;

    // Check if room already exists
    let room = await ChatRoom.findOne({
      participants: { $all: [buyerId, artisanId] },
      product: productId,
      isActive: true
    });

    if (!room) {
      room = await ChatRoom.create({
        participants: [buyerId, artisanId],
        product: productId
      });
    }

    res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user chat rooms
// @route   GET /api/chat/rooms
// @access  Private
exports.getUserRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      participants: req.user.id,
      isActive: true
    })
    .populate('participants', 'name avatar role')
    .populate('product', 'name images')
    .populate('order')
    .sort('-updatedAt');

    res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get room messages
// @route   GET /api/chat/rooms/:roomId/messages
// @access  Private
exports.getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (page - 1) * limit;

    // Check if user is participant
    const room = await ChatRoom.findById(roomId);
    if (!room.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Message.find({ chatRoom: roomId })
      .populate('sender', 'name avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Mark messages as read
    await Message.updateMany(
      { 
        chatRoom: roomId, 
        sender: { $ne: req.user.id },
        isRead: false 
      },
      { $set: { isRead: true } }
    );

    res.json({
      success: true,
      messages: messages.reverse()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send message
// @route   POST /api/chat/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { roomId, message, type = 'text', fileUrl } = req.body;

    // Check if user is participant
    const room = await ChatRoom.findById(roomId);
    if (!room.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

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
        const currentCount = room.unreadCount.get(participantId.toString()) || 0;
        room.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });

    await room.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name avatar');

    res.json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};