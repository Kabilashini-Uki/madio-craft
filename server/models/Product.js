// models/Product.js
import mongoose from 'mongoose';

const customizationOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['text', 'color', 'size', 'material', 'upload'], required: true },
  options: [{ type: String }],
  required: { type: Boolean, default: false },
  priceAdjustment: { type: Number, default: 0 },
});

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema({
  artisan: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    required: true,
    enum: ['jewelry', 'pottery', 'textiles', 'woodwork', 'metalwork', 'glass', 'other'],
  },
  images: [{
    public_id: { type: String, default: '' },
    url: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
  }],
  customizationOptions: [customizationOptionSchema],
  materials: [{ type: String }],
  dimensions: {
    height: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    depth: { type: Number, default: 0 },
    unit: { type: String, default: 'cm' },
  },
  stock: { type: Number, default: 1 },
  isCustomizable: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },

  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

productSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
    return;
  }
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.averageRating = sum / this.reviews.length;
  this.totalReviews = this.reviews.length;
};

productSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Product', productSchema);
