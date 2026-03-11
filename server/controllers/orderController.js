// controllers/orderController.js
import Order   from '../models/Order.js';
import Product from '../models/Product.js';
import Cart    from '../models/Cart.js';
import User    from '../models/User.js';

export const createOrder = async (req, res) => {
  try {
    const effectiveRole = req.user.activeRole || req.user.role;
    if ((req.user.role === 'artisan' || req.user.role === 'admin') && effectiveRole !== 'buyer') {
      return res.status(403).json({ message: 'Switch to buyer mode to place orders.' });
    }

    const { items, shippingAddress, subtotal, shippingCost, tax, totalAmount } = req.body;
    const buyer = req.user._id;

    if (!items?.length) return res.status(400).json({ message: 'No items in order' });

    let artisanUserId = null;
    const orderItems  = [];

    for (const item of items) {
      const product = await Product.findById(item.product).populate('artisan', '_id');
      if (!product?.isActive)
        return res.status(400).json({ message: `Product ${item.product} not available` });
      if (product.stock < item.quantity)
        return res.status(400).json({ message: `Only ${product.stock} units of ${product.name} available` });

      // product.artisan may be populated object or raw ObjectId
      const productArtisanId = product.artisan?._id || product.artisan;

      if (!artisanUserId) {
        artisanUserId = productArtisanId;
      } else if (String(artisanUserId) !== String(productArtisanId)) {
        return res.status(400).json({ message: 'All items must be from the same artisan' });
      }

      orderItems.push({
        product:       product._id,
        quantity:      item.quantity,
        customization: item.customization || {},
        price:         item.price || product.price,
        totalPrice:    (item.price || product.price) * item.quantity,
      });
    }

    const d = new Date();
    const orderId = `ORD${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`;

    const order = await Order.create({
      orderId,
      buyer,
      artisan:        artisanUserId,
      items:          orderItems,
      shippingAddress,
      paymentMethod:  'cod',
      paymentStatus:  'pending',
      orderStatus:    'pending',
      subtotal:       subtotal || 0,
      shippingCost:   shippingCost || 0,
      vat:            tax || 0,
      totalAmount:    totalAmount || 0,
      estimatedDelivery: new Date(Date.now() + 5 * 86400000),
    });

    // Notify artisan via socket
    try {
      const io = req.app.get('io');
      if (io) {
        const buyerUser   = await User.findById(buyer).select('name avatar');
        const productName = orderItems[0]?.product
          ? (await Product.findById(orderItems[0].product).select('name'))?.name || ''
          : '';
        io.to(`user-${artisanUserId}`).emit('new-order', {
          orderId,
          orderDbId:   String(order._id),
          amount:      totalAmount,
          buyerName:   buyerUser?.name || 'A buyer',
          buyerAvatar: buyerUser?.avatar?.url || '',
          productName,
          itemCount:   orderItems.length,
          message:     `New order #${orderId} from ${buyerUser?.name || 'a buyer'}`,
        });
        // Also notify admin
        io.emit('admin-new-order', {
          orderId,
          buyerName: buyerUser?.name || 'A buyer',
          amount:    totalAmount,
        });
      }
    } catch (e) { console.warn('Socket notify failed:', e.message); }

    // Reduce stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    // Clear cart
    await Cart.findOneAndUpdate({ user: buyer }, { $set: { items: [] } });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! You will pay on delivery.',
      order: {
        _id:            order._id,
        orderId:        order.orderId,
        totalAmount:    order.totalAmount,
        paymentMethod:  'cod',
        estimatedDelivery: order.estimatedDelivery,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('artisan', 'name artisanProfile.businessName avatar')
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
      String(order.buyer._id) === String(req.user._id) ||
      String(order.artisan._id) === String(req.user._id) ||
      req.user.role === 'admin';

    if (!isAuthorized) return res.status(403).json({ message: 'Not authorized' });

    res.json({ success: true, order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getArtisanOrders = async (req, res) => {
  try {
    const orders = await Order.find({ artisan: req.user._id })
      .populate('buyer', 'name email phone avatar')
      .populate('items.product', 'name images price')
      .sort('-createdAt');
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Get artisan orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isArtisan = String(order.artisan) === String(req.user._id);
    const isAdmin   = req.user.role === 'admin';
    if (!isArtisan && !isAdmin) return res.status(403).json({ message: 'Not authorized' });

    order.orderStatus = status;
    if (status === 'delivered') order.artisanMarkedDeliveredAt = new Date();
    await order.save();

    // Notify buyer via socket
    try {
      const io = req.app.get('io');
      if (io) {
        const populated = await Order.findById(order._id)
          .populate('artisan', 'name artisanProfile')
          .populate('items.product', 'name images');
        const payload = {
          orderId:      order.orderId,
          orderDbId:    String(order._id),
          status,
          artisanName:  populated?.artisan?.name || '',
          productName:  populated?.items?.[0]?.product?.name || '',
          productImage: populated?.items?.[0]?.product?.images?.[0]?.url || '',
          totalAmount:  order.totalAmount,
          isDelivered:  status === 'delivered',
        };
        io.to(`user-${order.buyer}`).emit('order-status-update', payload);
        // Admin notification too
        io.emit('admin-order-status', { orderId: order.orderId, status });
      }
    } catch (e) { console.warn('Socket status update failed:', e.message); }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('artisan', 'name')
      .populate('buyer', 'name');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.buyer._id) !== String(req.user._id))
      return res.status(403).json({ message: 'Not authorized' });

    const nonCancellable = ['order ready', 'shipped', 'delivered', 'cancelled'];
    if (nonCancellable.includes(order.orderStatus))
      return res.status(400).json({
        message: order.orderStatus === 'cancelled'
          ? 'Order already cancelled'
          : 'Cannot cancel this order — the artisan has already marked it as ready or shipped.',
      });

    order.orderStatus = 'cancelled';
    await order.save();

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${order.artisan._id}`).emit('order-cancelled', {
          message: `Order ${order.orderId} was cancelled by buyer ${order.buyer.name}`,
          orderId: order.orderId,
        });
        io.emit('admin-order-cancelled', { orderId: order.orderId, buyerName: order.buyer.name });
      }
    } catch (_) {}

    res.json({ success: true, message: 'Order cancelled', order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const submitOrderReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    const order = await Order.findById(req.params.id)
      .populate('artisan', 'name')
      .populate('items.product', 'name');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.buyer) !== String(req.user._id))
      return res.status(403).json({ message: 'Not authorized' });
    if (order.orderStatus !== 'delivered')
      return res.status(400).json({ message: 'Can only review delivered orders' });
    if (order.review) return res.status(400).json({ message: 'Already reviewed' });

    order.review    = { rating: Number(rating), comment: comment || '', createdAt: new Date() };
    order.reviewedAt = new Date();
    await order.save();

    try {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (!product) continue;
        const alreadyReviewed = product.ratings.reviews.find(r => String(r.user) === String(req.user._id));
        if (!alreadyReviewed) {
          product.ratings.reviews.push({ user: req.user._id, rating: Number(rating), comment: comment || '' });
          product.ratings.count   = product.ratings.reviews.length;
          product.ratings.average = product.ratings.reviews.reduce((a, r) => a + r.rating, 0) / product.ratings.reviews.length;
          await product.save();
        }
      }
    } catch (e) { console.warn('Product rating update failed:', e.message); }

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${order.artisan._id}`).emit('new-review', {
          orderId:     order.orderId,
          rating,
          comment,
          buyerName:   req.user.name,
          productName: order.items[0]?.product?.name || '',
        });
      }
    } catch (_) {}

    res.json({ success: true, message: 'Review submitted successfully', order });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const confirmReceived = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.buyer) !== String(req.user._id))
      return res.status(403).json({ message: 'Not authorized' });
    if (order.orderStatus !== 'delivered')
      return res.status(400).json({ message: 'Order not yet delivered' });

    order.buyerConfirmedAt = new Date();
    await order.save();

    res.json({ success: true, message: 'Delivery confirmed', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
