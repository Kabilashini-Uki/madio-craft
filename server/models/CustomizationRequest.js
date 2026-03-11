// models/CustomizationRequest.js
// Persists every customization request with sender, product, message, timestamp, status.

import mongoose from 'mongoose';

const customizationRequestSchema = new mongoose.Schema({
  // Who sent the request
  sender: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  senderName:   { type: String, default: '' },
  senderAvatar: { type: String, default: '' },

  // Which product
  product: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Product',
    required: true,
  },
  productName: { type: String, default: '' },

  // Which artisan (denormalised for quick queries)
  artisan: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },

  // Request details
  color:   { type: String, default: '' },
  size:    { type: String, default: '' },
  notes:   { type: String, default: '' },
  message: { type: String, default: '' }, // human-readable summary

  // Lifecycle
  status: {
    type:    String,
    enum:    ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  customizationPrice: { type: Number, default: 0 }, // price set by artisan when accepting
  respondedAt: { type: Date, default: null },

  // Linked chat room (optional)
  chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', default: null },

  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

// Index for quick artisan-side queries
customizationRequestSchema.index({ artisan: 1, status: 1, timestamp: -1 });
// Index for buyer-side queries
customizationRequestSchema.index({ sender: 1, timestamp: -1 });

export default mongoose.model('CustomizationRequest', customizationRequestSchema);
