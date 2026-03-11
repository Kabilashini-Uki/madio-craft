// models/User.js
import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: true,
    trim:     true,
  },
  email: {
    type:      String,
    required:  true,
    unique:    true,
    lowercase: true,
    trim:      true,
  },
  password: {
    type:      String,
    required:  true,
    minlength: 6,
  },
  role: {
    type:    String,
    enum:    ['buyer', 'artisan', 'admin'],
    default: 'buyer',
  },
  avatar: {
    public_id: { type: String, default: '' },
    url:       { type: String, default: '' },
  },
  coverImage: {
    public_id: { type: String, default: '' },
    url:       { type: String, default: '' },
  },
  backgroundImage: {
    public_id: { type: String, default: '' },
    url:       { type: String, default: '' },
  },
  bio:      { type: String, default: '' },
  location: { type: String, default: '' },
  phone:    { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  artisanProfile: {
    businessName:     { type: String, default: '' },
    description:      { type: String, default: '' },
    specialties:      [{ type: String }],
    yearsOfExperience:{ type: Number, default: 0 },
    portfolioImages:  [{ public_id: { type: String, default: '' }, url: { type: String, default: '' } }],
    socialLinks: {
      instagram: { type: String, default: '' },
      facebook:  { type: String, default: '' },
      website:   { type: String, default: '' },
    },
    ratings: {
      average: { type: Number, default: 0 },
      count:   { type: Number, default: 0 },
    },
  },
  buyerProfile: {
    shippingAddresses: [{
      name:      { type: String, default: '' },
      address:   { type: String, default: '' },
      city:      { type: String, default: '' },
      state:     { type: String, default: '' },
      country:   { type: String, default: 'India' },
      zipCode:   { type: String, default: '' },
      phone:     { type: String, default: '' },
      isDefault: { type: Boolean, default: false },
    }],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  originalRole:     { type: String, default: '' },
  activeRole:       { type: String, default: '' },
  isSuspended:      { type: Boolean, default: false },
  suspendedAt:      { type: Date,    default: null },
  suspensionReason: { type: String,  default: '' },
  // Login rate limiting
  loginAttempts:    { type: Number,  default: 0 },
  loginLockedUntil: { type: Date,    default: null },
  createdAt:        { type: Date,    default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);
