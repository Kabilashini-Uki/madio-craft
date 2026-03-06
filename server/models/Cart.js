// models/Cart.js
import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  customization: {
    options: [{
      name:            { type: String, default: '' },
      value:           { type: String, default: '' },
      priceAdjustment: { type: Number, default: 0 },
    }],
    notes:           { type: String, default: '' },
    referenceImages: [{ public_id: { type: String, default: '' }, url: { type: String, default: '' } }],
    dimensions: {
      width:  { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      depth:  { type: Number, default: 0 },
    },
    color:    { type: String, default: '' },
    material: { type: String, default: '' },
    deadline: { type: Date,   default: null },
  },
  price:      { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  addedAt:    { type: Date, default: Date.now },
});

const cartSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  coupon: {
    code:          { type: String, default: null },
    discountType:  { type: String, enum: ['percentage', 'fixed', null], default: null },
    discountValue: { type: Number, default: 0 },
    minOrderAmount:{ type: Number, default: 0 },
    appliedAt:     { type: Date, default: null },
  },
  currency:     { type: String, default: 'LKR', enum: ['LKR'] },
  subtotal:     { type: Number, default: 0, min: 0 },
  shippingZone: {
    type:    String,
    enum:    ['colombo', 'urban', 'rural', 'northern', 'eastern', 'southern', 'central', 'north_central', 'north_western', 'uva', 'sabaragamuwa'],
    default: 'colombo',
  },
  shippingCost:    { type: Number, default: 0, min: 0 },
  vat:             { type: Number, default: 0, min: 0 },
  nbt:             { type: Number, default: 0, min: 0 },
  cess:            { type: Number, default: 0, min: 0 },
  discount:        { type: Number, default: 0, min: 0 },
  total:           { type: Number, default: 0, min: 0 },
  deliveryMethod:  { type: String, enum: ['standard', 'express', 'pickup'], default: 'standard' },
  estimatedDeliveryDays: { min: { type: Number, default: 3 }, max: { type: Number, default: 7 } },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const shippingRates = {
  colombo:       { standard: 150, express: 350 },
  urban:         { standard: 250, express: 450 },
  rural:         { standard: 350, express: 550 },
  northern:      { standard: 450, express: 750 },
  eastern:       { standard: 400, express: 650 },
  southern:      { standard: 300, express: 500 },
  central:       { standard: 300, express: 500 },
  north_central: { standard: 400, express: 650 },
  north_western: { standard: 350, express: 550 },
  uva:           { standard: 400, express: 650 },
  sabaragamuwa:  { standard: 350, express: 550 },
};

const calculateShippingCost = (subtotal, zone, deliveryMethod) => {
  if (subtotal >= 5000) return 0;
  const zoneRates = shippingRates[zone] || shippingRates.colombo;
  return zoneRates[deliveryMethod] || zoneRates.standard;
};

const calculateTaxes = (subtotal, items) => {
  const VAT_RATE = 0.15;
  const NBT_RATE = 0.025;
  const hasNbtItems = items.some((i) => i.customization?.material === 'luxury' || i.price > 50000);
  return {
    vat:  subtotal * VAT_RATE,
    nbt:  hasNbtItems ? subtotal * NBT_RATE : 0,
    cess: 0,
  };
};

cartSchema.pre('save', function (next) {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  const taxes  = calculateTaxes(this.subtotal, this.items);
  this.vat     = taxes.vat;
  this.nbt     = taxes.nbt;
  this.cess    = taxes.cess;
  this.shippingCost = calculateShippingCost(this.subtotal, this.shippingZone, this.deliveryMethod);

  let discount = 0;
  if (this.coupon?.code && this.subtotal >= (this.coupon.minOrderAmount || 0)) {
    if (this.coupon.discountType === 'percentage') {
      discount = Math.min(this.subtotal * (this.coupon.discountValue / 100), 5000);
    } else if (this.coupon.discountType === 'fixed') {
      discount = this.coupon.discountValue;
    }
  }
  this.discount   = Math.min(discount, this.subtotal);
  this.total      = this.subtotal + this.vat + this.nbt + this.cess + this.shippingCost - this.discount;
  this.updatedAt  = new Date();
  next();
});

cartSchema.methods.hasFreeShipping   = function () { return this.subtotal >= 5000; };
cartSchema.methods.getDeliveryEstimate = function () {
  const today   = new Date();
  const minDate = new Date(today);
  const maxDate = new Date(today);
  minDate.setDate(minDate.getDate() + this.estimatedDeliveryDays.min);
  maxDate.setDate(maxDate.getDate() + this.estimatedDeliveryDays.max);
  return { min: minDate, max: maxDate, text: `${this.estimatedDeliveryDays.min}-${this.estimatedDeliveryDays.max} business days` };
};

export default mongoose.model('Cart', cartSchema);
