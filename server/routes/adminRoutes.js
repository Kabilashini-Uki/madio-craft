const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Admin middleware
const adminOnly = authorize('admin');

// Mock admin functions
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const User = require('../models/User');
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    
    const userCount = await User.countDocuments();
    const artisanCount = await User.countDocuments({ role: 'artisan' });
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { 'paymentInfo.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);
    
    res.json({
      success: true,
      stats: {
        users: userCount,
        artisans: artisanCount,
        products: productCount,
        orders: orderCount,
        revenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find()
      .select('-password')
      .sort('-createdAt');
    
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;