// models/Cart.js
import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  customization: {
    options: [{
      name: { type: String, default: '' },
      value: { type: String, default: '' },
      priceAdjustment: { type: Number, default: 0 },
    }],
    notes: { type: String, default: '' },
    referenceImages: [{ public_id: { type: String, default: '' }, url: { type: String, default: '' } }],
    dimensions: {
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      depth: { type: Number, default: 0 },
    },
    color: { type: String, default: '' },
    material: { type: String, default: '' },
    deadline: { type: Date, default: null },
  },
  price: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  addedAt: { type: Date, default: Date.now },
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  currency: { type: String, default: 'LKR', enum: ['LKR'] },
  subtotal: { type: Number, default: 0, min: 0 },
  vat: { type: Number, default: 0, min: 0 },
  nbt: { type: Number, default: 0, min: 0 },
  cess: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0, min: 0 },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });


const calculateTaxes = (subtotal, items) => {
  const VAT_RATE = 0.15;
  const NBT_RATE = 0.025;
  const hasNbtItems = items.some((i) => i.customization?.material === 'luxury' || i.price > 50000);
  return {
    vat: subtotal * VAT_RATE,
    nbt: hasNbtItems ? subtotal * NBT_RATE : 0,
    cess: 0,
  };
};

cartSchema.pre('save', async function () {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  const taxes = calculateTaxes(this.subtotal, this.items);
  this.vat = taxes.vat;
  this.nbt = taxes.nbt;
  this.cess = taxes.cess;

  this.total = this.subtotal + this.vat + this.nbt + this.cess;
  this.updatedAt = new Date();
});


export default mongoose.model('Cart', cartSchema);
