// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const User = require('../models/User');

// @route   GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio, location, phone, artisanProfile } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (phone !== undefined) user.phone = phone;
    if (artisanProfile && user.role === 'artisan') {
      user.artisanProfile = { ...user.artisanProfile.toObject(), ...artisanProfile };
    }
    
    await user.save();
    const updated = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/avatar
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const user = await User.findById(req.user.id);
    user.avatar = { public_id: req.file.public_id || '', url: req.file.path || req.file.secure_url };
    await user.save();
    res.json({ success: true, avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/artisans
router.get('/artisans', async (req, res) => {
  try {
    const { limit = 10, page = 1, search } = req.query;
    const filter = { role: 'artisan' };
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const artisans = await User.find(filter)
      .select('name avatar artisanProfile location isVerified createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt');
    const total = await User.countDocuments(filter);
    
    res.json({ success: true, users: artisans, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/artisan/:id
router.get('/artisan/:id', async (req, res) => {
  try {
    const artisan = await User.findOne({ _id: req.params.id, role: 'artisan' }).select('-password');
    if (!artisan) return res.status(404).json({ message: 'Artisan not found' });
    res.json({ success: true, user: artisan });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/shipping-address
router.post('/shipping-address', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.buyerProfile) user.buyerProfile = { shippingAddresses: [] };
    if (!user.buyerProfile.shippingAddresses) user.buyerProfile.shippingAddresses = [];
    
    const { setDefault, ...addressData } = req.body;
    
    if (setDefault) {
      user.buyerProfile.shippingAddresses.forEach(a => a.isDefault = false);
      addressData.isDefault = true;
    }
    
    user.buyerProfile.shippingAddresses.push(addressData);
    await user.save();
    res.json({ success: true, addresses: user.buyerProfile.shippingAddresses });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/wishlist
router.get('/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('buyerProfile.wishlist');
    if (!user.buyerProfile) user.buyerProfile = { wishlist: [] };
    if (!user.buyerProfile.wishlist) user.buyerProfile.wishlist = [];
    
    res.json({ success: true, wishlist: user.buyerProfile.wishlist || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/wishlist/add
router.post('/wishlist/add', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user.buyerProfile) user.buyerProfile = {};
    if (!user.buyerProfile.wishlist) user.buyerProfile.wishlist = [];
    
    // Check if already in wishlist
    if (!user.buyerProfile.wishlist.includes(productId)) {
      user.buyerProfile.wishlist.push(productId);
      await user.save();
    }
    
    res.json({ success: true, message: 'Added to wishlist', wishlist: user.buyerProfile.wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/wishlist/:productId
router.delete('/wishlist/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user.buyerProfile) user.buyerProfile = { wishlist: [] };
    
    user.buyerProfile.wishlist = user.buyerProfile.wishlist.filter(
      id => id.toString() !== productId
    );
    await user.save();
    
    res.json({ success: true, message: 'Removed from wishlist', wishlist: user.buyerProfile.wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/wishlist/check/:productId
router.get('/wishlist/check/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user.buyerProfile || !user.buyerProfile.wishlist) {
      return res.json({ success: true, inWishlist: false });
    }
    
    const inWishlist = user.buyerProfile.wishlist.some(id => id.toString() === productId);
    res.json({ success: true, inWishlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
