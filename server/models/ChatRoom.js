// models/ChatRoom.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatRoom: { type: mongoose.Schema.Types.Mixed, ref: 'ChatRoom', required: true },
  sender:   { type: mongoose.Schema.Types.Mixed, ref: 'User',     required: true },
  message:  { type: String, required: true, trim: true },
  type:     { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
  fileUrl:  { type: String, default: '' },
  isRead:   { type: Boolean, default: false },
  createdAt:{ type: Date, default: Date.now },
});

const chatRoomSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.Mixed, ref: 'User', required: true }],
  order:        { type: mongoose.Schema.Types.Mixed, ref: 'Order' },
  product:      { type: mongoose.Schema.Types.Mixed, ref: 'Product' },
  type:         { type: String, enum: ['general', 'customization', 'order'], default: 'general' },
  customizationData: {
    options:   { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    dimensions:{ width: Number, height: Number, depth: Number },
    notes:     String,
    quantity:  { type: Number, default: 1 },
    deadline:  Date,
    estimatedPrice: Number,
    finalPrice:     Number,
  },
  customizationStatus: {
    type:    String,
    enum:    ['draft', 'pending', 'quote_sent', 'accepted', 'declined', 'in_progress', 'completed'],
    default: 'draft',
  },
  lastMessage: {
    sender:   { type: mongoose.Schema.Types.Mixed, ref: 'User' },
    message:  { type: String, default: '' },
    type:     { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
    createdAt:{ type: Date, default: Date.now },
  },
  unreadCount: { type: Map, of: Number, default: {} },
  isActive:    { type: Boolean, default: true },
  createdBy:   { type: mongoose.Schema.Types.Mixed, ref: 'User' },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});

chatRoomSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
export const Message  = mongoose.model('Message',  messageSchema);
