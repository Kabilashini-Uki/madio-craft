// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Admin middleware
const adminOnly = authorize('admin');

// @desc    Get dashboard statistics
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const artisanCount = await User.countDocuments({ role: 'artisan' });
    const buyerCount = await User.countDocuments({ role: 'buyer' });
    const productCount = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const orderCount = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ orderStatus: 'delivered' });
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    
    const revenue = await Order.aggregate([
      { $match: { 'paymentInfo.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);

    res.json({
      success: true,
      stats: {
        users: { total: userCount, artisans: artisanCount, buyers: buyerCount, newToday: 0 },
        products: { total: productCount, active: activeProducts, pending: 0, lowStock: 0 },
        orders: { total: orderCount, pending: pendingOrders, completed: completedOrders, revenue: revenue[0]?.total || 0 },
        disputes: { total: 0, open: 0, resolved: 0 }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Verify artisan
router.put('/users/:id/verify', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.isVerified = true;
    await user.save();
    
    res.json({ success: true, message: 'Artisan verified' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Suspend user
router.put('/users/:id/suspend', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.isSuspended = !user.isSuspended;
    await user.save();
    
    res.json({ success: true, message: 'User status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete user
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all products
router.get('/products', protect, adminOnly, async (req, res) => {
  try {
    const products = await Product.find().populate('artisan', 'name').sort('-createdAt');
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update product status
router.put('/products/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { isActive } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    product.isActive = isActive;
    await product.save();
    
    res.json({ success: true, message: 'Product status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete product
router.delete('/products/:id', protect, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all orders
router.get('/orders', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('buyer', 'name')
      .populate('artisan', 'name')
      .populate('items.product', 'name')
      .sort('-createdAt');
    
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update order status
router.put('/orders/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    order.orderStatus = status;
    await order.save();
    
    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Process refund
router.post('/orders/:id/refund', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    order.paymentInfo.status = 'refunded';
    await order.save();
    
    res.json({ success: true, message: 'Refund processed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;