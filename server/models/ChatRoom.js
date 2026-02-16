// server/models/ChatRoom.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and string
    required: true,
    ref: 'User'
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatRoomSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and string
    ref: 'User',
    required: true
  }],
  order: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Order'
  },
  product: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Product'
  },
  type: {
    type: String,
    enum: ['general', 'customization', 'order'],
    default: 'general'
  },
  customizationData: {
    options: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    dimensions: {
      width: Number,
      height: Number,
      depth: Number
    },
    notes: String,
    quantity: {
      type: Number,
      default: 1
    },
    deadline: Date,
    estimatedPrice: Number,
    finalPrice: Number
  },
  customizationStatus: {
    type: String,
    enum: ['draft', 'pending', 'quote_sent', 'accepted', 'declined', 'in_progress', 'completed'],
    default: 'draft'
  },
  lastMessage: {
    sender: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User'
    },
    message: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

chatRoomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add a pre-find middleware to handle string IDs
chatRoomSchema.pre(/^find/, function(next) {
  // This helps with population when using string IDs
  next();
});

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { ChatRoom, Message };