// controllers/adminController.js
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Artisan from '../models/Artisan.js';
import jwt from 'jsonwebtoken';

// GET /api/admin/stats
export const getStats = async (req, res) => {
  try {
    const [totalUsers, artisanCount, buyerCount, totalProducts, activeProducts,
      totalOrders, pendingOrders, deliveredOrders, cancelledOrders, revenue] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'artisan' }),
        User.countDocuments({ role: 'buyer' }),
        Product.countDocuments(),
        Product.countDocuments({ isActive: true }),
        Order.countDocuments(),
        Order.countDocuments({ orderStatus: 'pending' }),
        Order.countDocuments({ orderStatus: 'delivered' }),
        Order.countDocuments({ orderStatus: 'cancelled' }),
        Order.aggregate([
          { $match: { orderStatus: 'delivered' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
      ]);

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, artisans: artisanCount, buyers: buyerCount },
        products: { total: totalProducts, active: activeProducts },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
          revenue: revenue[0]?.total || 0,
        },
      },
    });
  } catch (e) {
    console.error('Admin stats error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt').lean();

    // Enrich artisan users with their stats from Artisan model
    const enrichedUsers = await Promise.all(users.map(async (u) => {
      if (u.role === 'artisan') {
        const artisan = await Artisan.findOne({ user: u._id }).select('stats businessName isVerified').lean();
        return { ...u, artisanProfile: { ...u.artisanProfile, ...artisan } };
      }
      return u;
    }));

    res.json({ success: true, users: enrichedUsers });
  } catch (e) {
    console.error('Get users error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('artisan', 'name artisanProfile.businessName')
      .sort('-createdAt');
    res.json({ success: true, products });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/orders
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('buyer', 'name email phone location buyerProfile')
      .populate('artisan', 'name email artisanProfile')
      .populate('items.product', 'name images category price')
      .sort('-createdAt');
    res.json({ success: true, orders });
  } catch (e) {
    console.error('Get orders error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/admin/users/:id/verify
export const verifyArtisan = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/admin/users/:id/suspend
export const suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isSuspended = !user.isSuspended;
    user.suspendedAt = user.isSuspended ? new Date() : null;
    await user.save();
    res.json({ success: true, user: { ...user.toObject(), password: undefined } });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/admin/products/:id/status
export const updateProductStatus = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ success: true, product });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/admin/products/:id
export const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/admin/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus: req.body.status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/admin/orders/:id/refund
export const refundOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id,
      { 'paymentInfo.status': 'refunded', orderStatus: 'cancelled' }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/admin/login-as/:userId  — generate impersonation token
export const loginAsUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId).select('-password');
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    if (targetUser.role === 'admin') return res.status(403).json({ message: 'Cannot impersonate admin' });

    const token = jwt.sign(
      { id: targetUser._id, impersonatedBy: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
    res.json({ success: true, token, user: { ...targetUser.toObject() } });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/artisans/:id/stats
export const getArtisanStats = async (req, res) => {
  try {
    const artisanId = req.params.id;
    const [orders, products] = await Promise.all([
      Order.find({ artisan: artisanId }),
      Product.find({ artisan: artisanId }).sort('-createdAt')
    ]);

    const delivered = orders.filter(o => o.orderStatus === 'delivered').length;
    const cancelled = orders.filter(o => o.orderStatus === 'cancelled').length;
    const pending = orders.filter(o => ['pending', 'confirmed'].includes(o.orderStatus)).length;
    const revenue = orders.filter(o => o.orderStatus === 'delivered').reduce((s, o) => s + (o.totalAmount || 0), 0);
    const commission = revenue * 0.1; // 10%

    // monthly breakdown
    const monthly = {};
    orders.forEach(o => {
      const key = `${new Date(o.createdAt).getFullYear()}-${String(new Date(o.createdAt).getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { month: key, count: 0, revenue: 0, commission: 0, quantity: 0 };
      monthly[key].count++;
      if (o.orderStatus === 'delivered') {
        monthly[key].revenue += o.totalAmount || 0;
        monthly[key].commission += (o.totalAmount || 0) * 0.1;
      }
      monthly[key].quantity += o.items?.reduce((s, i) => s + i.quantity, 0) || 0;
    });

    res.json({
      success: true,
      stats: {
        total: orders.length, delivered, cancelled, pending,
        revenue, commission,
        products, // Include products list
        monthly: Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)),
      },
    });
  } catch (e) {
    console.error('Get artisan stats error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};
