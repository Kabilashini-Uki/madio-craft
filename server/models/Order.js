// models/Order.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  customization: {
    options: [{
      name: { type: String, default: '' },
      value: { type: String, default: '' },
      priceAdjustment: { type: Number, default: 0 },
    }],
    notes: { type: String, default: '' },
    referenceImages: [{ public_id: { type: String, default: '' }, url: { type: String, default: '' } }],
  },
  price: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
});

const reviewSchema = new mongoose.Schema({
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  artisan: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  deliveryAddress: {
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    district: { type: String, default: 'Batticaloa' },
    phone: { type: String, default: '' },
  },
  paymentMethod: { type: String, enum: ['cod'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'order ready', 'delivered', 'cancelled'],
    default: 'pending',
  },
  buyerConfirmedAt: { type: Date, default: null },
  artisanMarkedDeliveredAt: { type: Date, default: null },
  buyerReceived: { type: Boolean, default: null },
  buyerReview: { type: reviewSchema, default: null },
  
  subtotal: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  notes: { type: String, default: '' },

  isCustomized: { type: Boolean, default: false },
  customizationRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomizationRequest', default: null },
  customizationPrice: { type: Number, default: 0 },

  artisanReceivedPayment: { type: Boolean, default: false },

  chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

orderSchema.pre('save', async function () {
  this.updatedAt = Date.now();
  if (!this.orderId) {
    const d = new Date();
    const yr = d.getFullYear().toString().slice(-2);
    const mo = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderId = `MC${yr}${mo}${day}${rand}`;
  }
});

export default mongoose.model('Order', orderSchema);