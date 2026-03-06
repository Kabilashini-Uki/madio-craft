// models/Order.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  customization: {
    options: [{
      name:            { type: String, default: '' },
      value:           { type: String, default: '' },
      priceAdjustment: { type: Number, default: 0 },
    }],
    notes:           { type: String, default: '' },
    referenceImages: [{ public_id: { type: String, default: '' }, url: { type: String, default: '' } }],
  },
  price:      { type: Number, required: true },
  totalPrice: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true },
  buyer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  artisan: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:   [orderItemSchema],
  shippingAddress: {
    name:     { type: String, default: '' },
    address:  { type: String, default: '' },
    city:     { type: String, default: '' },
    district: { type: String, default: '' },
    province: { type: String, default: '' },
    zipCode:  { type: String, default: '' },
    phone:    { type: String, default: '' },
  },
  paymentMethod:  { type: String, enum: ['online', 'cod'], required: true },
  paymentStatus:  { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], default: 'pending' },
  paymentDetails: {
    transactionId: { type: String, default: '' },
    paidAt:        { type: Date,   default: null },
    cardLastFour:  { type: String, default: '' },
    bankName:      { type: String, default: '' },
  },
  orderStatus: {
    type:    String,
    enum:    ['pending', 'confirmed', 'processing', 'order ready', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  buyerConfirmedAt:        { type: Date, default: null },
  artisanMarkedDeliveredAt:{ type: Date, default: null },

  subtotal:     { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  vat:          { type: Number, default: 0 },
  nbt:          { type: Number, default: 0 },
  discount:     { type: Number, default: 0 },
  totalAmount:  { type: Number, required: true },
  couponCode:   { type: String, default: '' },
  notes:        { type: String, default: '' },

  estimatedDelivery: { type: Date,   default: null },
  trackingNumber:    { type: String, default: '' },
  trackingUrl:       { type: String, default: '' },
  chatRoom:          { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (!this.orderId) {
    const d      = new Date();
    const yr     = d.getFullYear().toString().slice(-2);
    const mo     = (d.getMonth() + 1).toString().padStart(2, '0');
    const day    = d.getDate().toString().padStart(2, '0');
    const rand   = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderId = `MC${yr}${mo}${day}${rand}`;
  }
  next();
});

export default mongoose.model('Order', orderSchema);
