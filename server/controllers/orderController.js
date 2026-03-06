// controllers/orderController.js
import Order   from '../models/Order.js';
import Product from '../models/Product.js';
import Cart    from '../models/Cart.js';

export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, subtotal, shippingCost, tax, totalAmount } = req.body;
    const buyer = req.user.id;

    if (!items?.length) return res.status(400).json({ message: 'No items in order' });

    let artisanId  = null;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product?.isActive) return res.status(400).json({ message: `Product ${item.product} not available` });
      if (product.stock < item.quantity) return res.status(400).json({ message: `Only ${product.stock} units of ${product.name} available` });

      if (!artisanId) {
        artisanId = product.artisan;
      } else if (artisanId.toString() !== product.artisan.toString()) {
        return res.status(400).json({ message: 'All items must be from the same artisan' });
      }

      orderItems.push({ product: product._id, quantity: item.quantity, customization: item.customization || {}, price: item.price, totalPrice: item.price * item.quantity });
    }

    const d       = new Date();
    const orderId = `ORD${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`;

    const order = await Order.create({
      orderId, buyer, artisan: artisanId, items: orderItems, shippingAddress,
      paymentMethod: 'cod', paymentStatus: 'pending', orderStatus: 'pending',
      subtotal, shippingCost, tax, totalAmount,
      estimatedDelivery: new Date(Date.now() + 5 * 86400000),
    });

    try {
      const io = req.app.get('io');
      if (io) io.to(`user-${artisanId}`).emit('new-order', { message: `New order received! Order ID: ${orderId}`, orderId, amount: totalAmount });
    } catch (e) { console.warn('Socket notify failed:', e.message); }

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    await Cart.findOneAndUpdate({ user: buyer }, { $set: { items: [] } });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! You will pay on delivery.',
      order: { _id: order._id, orderId: order.orderId, totalAmount: order.totalAmount, paymentMethod: 'cod', estimatedDelivery: order.estimatedDelivery },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate('artisan', 'name artisanProfile.businessName')
      .populate('items.product', 'name images')
      .sort('-createdAt');

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer',   'name email')
      .populate('artisan', 'name artisanProfile.businessName')
      .populate('items.product', 'name images price');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isAuthorized =
      order.buyer._id.toString() === req.user.id ||
      order.artisan._id.toString() === req.user.id ||
      req.user.role === 'admin';

    if (!isAuthorized) return res.status(403).json({ message: 'Not authorized' });

    res.json({ success: true, order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/orders/artisan-orders — artisan's incoming orders
export const getArtisanOrders = async (req, res) => {
  try {
    const orders = await Order.find({ artisan: req.user.id })
      .populate('buyer', 'name email phone')
      .populate('items.product', 'name images price')
      .sort('-createdAt');
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/orders/:id/status — artisan updates order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isArtisan = order.artisan.toString() === req.user.id;
    const isAdmin   = req.user.role === 'admin';
    if (!isArtisan && !isAdmin) return res.status(403).json({ message: 'Not authorized' });

    order.orderStatus = status;
    await order.save();

    // notify buyer via socket
    try {
      const io = req.app.get('io');
      if (io) io.to(`user-${order.buyer}`).emit('order-status-update', { orderId: order.orderId, status });
    } catch (e) {}

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/orders/:id/cancel — buyer cancels order
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('artisan', 'name')
      .populate('buyer', 'name');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.buyer._id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (['delivered','cancelled'].includes(order.orderStatus))
      return res.status(400).json({ message: 'Cannot cancel this order' });

    order.orderStatus = 'cancelled';
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    // notify artisan and admin
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${order.artisan._id}`).emit('order-cancelled', {
          message: `Order ${order.orderId} was cancelled by buyer ${order.buyer.name}`,
          orderId: order.orderId,
        });
      }
    } catch (e) {}

    res.json({ success: true, message: 'Order cancelled', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
