// models/Artisan.js
import mongoose from 'mongoose';

const portfolioImageSchema = new mongoose.Schema({
  public_id: { type: String, required: true },
  url: { type: String, required: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now },
});

const reviewSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerName: { type: String, required: true },
  buyerAvatar: { type: String, default: '' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  isVerifiedPurchase: { type: Boolean, default: false },
  images: [{ public_id: String, url: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuingAuthority: { type: String, required: true },
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date },
  certificateUrl: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
});

const bankDetailsSchema = new mongoose.Schema({
  accountHolderName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  confirmAccountNumber: { type: String, default: '' },
  ifscCode: { type: String, default: '' },
  bankName: { type: String, default: '' },
  branchName: { type: String, default: '' },
  upiId: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
});

const socialLinksSchema = new mongoose.Schema({
  instagram: { type: String, default: '' },
  facebook: { type: String, default: '' },
  twitter: { type: String, default: '' },
  youtube: { type: String, default: '' },
  pinterest: { type: String, default: '' },
  website: { type: String, default: '' },
  etsy: { type: String, default: '' },
  amazon: { type: String, default: '' },
});

const artisanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  businessName: { type: String, trim: true, default: '' },
  tagline: { type: String, default: '', maxlength: [100, 'Tagline cannot exceed 100 characters'] },
  description: { type: String, default: '', maxlength: [2000, 'Description cannot exceed 2000 characters'] },
  story: { type: String, default: '', maxlength: [5000, 'Story cannot exceed 5000 characters'] },

  craftCategory: {
    type: String,
    default: 'other',
    enum: ['pottery', 'jewelry', 'textiles', 'woodwork', 'metalwork', 'glass', 'leather', 'paper', 'embroidery', 'carpentry', 'sculpture', 'painting', 'weaving', 'basketry', 'other'],
  },
  otherCraftCategory: { type: String, default: '', trim: true },
  specialties: [{ type: String, trim: true }],
  yearsOfExperience: { type: Number, default: 0, min: 0, max: 100 },
  yearStarted: {
    type: Number,
    default: function () { return new Date().getFullYear() - this.yearsOfExperience; },
  },

  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    country: { type: String, default: 'India' },
    pincode: { type: String, default: '' },
    landmark: { type: String, default: '' },
  },

  phone: { type: String, default: '' },
  alternatePhone: { type: String, default: '' },
  email: { type: String, lowercase: true, trim: true, default: '' },
  website: { type: String, default: '' },
  socialLinks: { type: socialLinksSchema, default: {} },

  profileImage: {
    public_id: { type: String, default: '' },
    url: { type: String, default: 'https://res.cloudinary.com/demo/image/upload/v1631234567/default-avatar.png' },
  },
  coverImage: {
    public_id: { type: String, default: '' },
    url: { type: String, default: 'https://images.pexels.com/photos/18633243/pexels-photo-18633243.jpeg' },
  },
  logo: { public_id: { type: String, default: '' }, url: { type: String, default: '' } },
  portfolioImages: [portfolioImageSchema],

  gstNumber: { type: String, default: '' },
  panNumber: { type: String, default: '' },
  aadharNumber: { type: String, default: '' },
  businessRegistrationNumber: { type: String, default: '' },
  isGSTRegistered: { type: Boolean, default: false },
  bankDetails: { type: bankDetailsSchema, default: null },
  certifications: [certificationSchema],
  awards: [{
    title: { type: String, required: true },
    issuer: { type: String, required: true },
    year: { type: Number, required: true },
    description: { type: String, default: '' },
    certificateUrl: { type: String, default: '' },
  }],

  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
  },
  reviews: [reviewSchema],

  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verificationDocuments: [{ name: String, public_id: String, url: String, uploadedAt: { type: Date, default: Date.now } }],

  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  featuredUntil: { type: Date },
  shopOpen: { type: Boolean, default: true },
  acceptCustomOrders: { type: Boolean, default: true },
  estimatedProcessingDays: { min: { type: Number, default: 3 }, max: { type: Number, default: 7 } },

  shippingPolicies: {
    domesticShipping: { type: String, default: 'Free shipping on orders above ₹999' },
    internationalShipping: { type: String, default: 'Not available' },
    returnPolicy: { type: String, default: 'Returns accepted within 7 days of delivery' },
    cancellationPolicy: { type: String, default: 'Cancellation allowed within 24 hours of order placement' },
  },
  acceptedPaymentMethods: [{ type: String, enum: ['razorpay', 'bank_transfer', 'upi', 'cod'], default: ['razorpay'] }],

  stats: {
    totalProducts: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    repeatCustomers: { type: Number, default: 0 },
    responseTime: { type: String, default: 'Within 24 hours' },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followerCount: { type: Number, default: 0 },
  },

  tags: [{ type: String, trim: true }],
  searchKeywords: [{ type: String, trim: true }],
  metaDescription: { type: String, default: '' },

  joinedAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

artisanSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

artisanSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.ratings = { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    return;
  }
  let sum = 0;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  this.reviews.forEach((r) => { sum += r.rating; distribution[r.rating] = (distribution[r.rating] || 0) + 1; });
  this.ratings.average = sum / this.reviews.length;
  this.ratings.count = this.reviews.length;
  this.ratings.distribution = distribution;
};

artisanSchema.methods.calculateStats = async function () {
  const Order = mongoose.model('Order');
  const orders = await Order.find({ artisan: this.user, orderStatus: { $in: ['delivered', 'completed'] } });
  this.stats.totalOrders = orders.length;
  this.stats.completedOrders = orders.length;
  this.stats.totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  this.stats.averageOrderValue = orders.length > 0 ? this.stats.totalRevenue / orders.length : 0;
  await this.save();
};

artisanSchema.index({ businessName: 'text', description: 'text', tags: 'text' });
artisanSchema.index({ 'address.city': 1, 'address.state': 1 });
artisanSchema.index({ craftCategory: 1 });
artisanSchema.index({ isVerified: 1, isFeatured: 1 });
artisanSchema.index({ 'ratings.average': -1 });

export default mongoose.model('Artisan', artisanSchema);
