// controllers/orderController.js
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export const createOrder = async (req, res) => {
  try {
    // Artisans can order from OTHER shops, but not their own
    // Admins cannot place orders
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot place orders.' });
    }

    const { items, deliveryAddress, subtotal, totalAmount } = req.body;
    const buyer = req.user._id;

    if (!items?.length) return res.status(400).json({ message: 'No items in order' });

    let artisanUserId = null;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product).populate('artisan', '_id');
      if (!product?.isActive)
        return res.status(400).json({ message: `Product ${item.product} not available` });
      if (product.stock < item.quantity)
        return res.status(400).json({ message: `Only ${product.stock} units of ${product.name} available` });

      const productArtisanId = product.artisan?._id || product.artisan;

      // Prevent artisan from ordering from their own shop
      if (req.user.role === 'artisan' && String(productArtisanId) === String(req.user._id)) {
        return res.status(403).json({ message: 'You cannot purchase from your own shop' });
      }

      if (!artisanUserId) {
        artisanUserId = productArtisanId;
      } else if (String(artisanUserId) !== String(productArtisanId)) {
        return res.status(400).json({ message: 'All items must be from the same artisan' });
      }

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        customization: item.customization || {},
        price: item.price || product.price,
        totalPrice: (item.price || product.price) * item.quantity,
      });
    }

    const d = new Date();
    const orderId = `ORD${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const order = await Order.create({
      orderId,
      buyer,
      artisan: artisanUserId,
      items: orderItems,
      deliveryAddress,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      subtotal: subtotal || 0,
      totalAmount: totalAmount || 0,
    });

    // Notify artisan via socket
    try {
      const io = req.app.get('io');
      if (io) {
        const buyerUser = await User.findById(buyer).select('name avatar');
        const productName = orderItems[0]?.product
          ? (await Product.findById(orderItems[0].product).select('name'))?.name || ''
          : '';
        const socketPayload = {
          orderId,
          orderDbId: String(order._id),
          amount: totalAmount,
          buyerName: buyerUser?.name || 'A buyer',
          buyerAvatar: buyerUser?.avatar?.url || '',
          productName,
          itemCount: orderItems.length,
          message: `New order #${orderId} from ${buyerUser?.name || 'a buyer'}`,
        };
        await Notification.create({
          user: artisanUserId,
          userModel: 'User',
          type: 'new-order',
          title: 'New Order Received!',
          body: socketPayload.message,
          data: socketPayload
        });
        io.to(`user-${artisanUserId}`).emit('new-order', socketPayload);
        io.emit('admin-new-order', {
          orderId,
          buyerName: buyerUser?.name || 'A buyer',
          amount: totalAmount,
        });
      }
    } catch (e) { console.warn('Socket notify failed:', e.message); }

    // Reduce stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    // Clear ordered items from cart
    const cart = await Cart.findOne({ user: buyer });
    if (cart) {
      const orderedProductIds = orderItems.map(item => String(item.product));
      cart.items = cart.items.filter(item => !orderedProductIds.includes(String(item.product)));
      await cart.save();
    }

    // Notify buyer via socket
    try {
      const io = req.app.get('io');
      if (io) {
        const payload = {
          orderId,
          orderDbId: String(order._id),
          totalAmount: totalAmount || 0,
        };
        await Notification.create({
          user: buyer,
          userModel: 'User',
          type: 'order-status',
          title: 'Order Confirmed',
          body: `Your order #${orderId} was placed successfully!`,
          data: payload
        });
        io.to(`user-${buyer}`).emit('order-status-update', { ...payload, status: 'pending' });
      }
    } catch (e) { console.warn('Socket notify failed:', e.message); }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! You will pay on delivery.',
      order: {
        _id: order._id,
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        paymentMethod: 'cod',
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
      .populate('artisan', 'name email avatar artisanProfile')
      .populate('items.product', 'name images price')
      .sort('-createdAt')
      .lean();
    res.json({ success: true, orders });
  } catch (error) {
    console.error('❌ Get my orders error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load orders', error: error.message });
  }
};

export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email')
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
      .sort('-createdAt')
      .lean();
    res.json({ success: true, orders });
  } catch (error) {
    console.error('❌ Get artisan orders error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load orders', error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isArtisan = String(order.artisan) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
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
          orderId: order.orderId,
          orderDbId: String(order._id),
          status,
          artisanName: populated?.artisan?.name || '',
          productName: populated?.items?.[0]?.product?.name || '',
          productImage: populated?.items?.[0]?.product?.images?.[0]?.url || '',
          totalAmount: order.totalAmount,
          isDelivered: status === 'delivered',
        };
        await Notification.create({
          user: order.buyer,
          userModel: 'User',
          type: 'order-status',
          title: status === 'delivered' ? '🎉 Order Delivered!' : 'Order Status Updated',
          body: status === 'delivered'
            ? `Your order #${order.orderId} has been delivered! Please confirm and leave a review.`
            : `Order #${order.orderId} is now "${status}"`,
          data: payload
        });
        io.to(`user-${order.buyer}`).emit('order-status-update', payload);
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
        const payload = {
          message: `Order ${order.orderId} was cancelled by buyer ${order.buyer.name}`,
          orderId: order.orderId,
        };
        await Notification.create({
          user: order.artisan._id || order.artisan,
          userModel: 'User',
          type: 'order-cancelled',
          title: 'Order Cancelled',
          body: payload.message,
          data: payload
        });
        io.to(`user-${order.artisan._id}`).emit('order-cancelled', payload);
        io.emit('admin-order-cancelled', { orderId: order.orderId, buyerName: order.buyer.name });
      }
    } catch (_) { }

    res.json({ success: true, message: 'Order cancelled', order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const confirmReceived = async (req, res) => {
  try {
    const { received, rating, comment } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.buyer) !== String(req.user._id))
      return res.status(403).json({ message: 'Not authorized' });
    if (order.orderStatus !== 'delivered')
      return res.status(400).json({ message: 'Order not yet delivered' });

    order.buyerConfirmedAt = new Date();
    order.buyerReceived = received;

    // If buyer confirms receipt with rating, store review
    if (received && rating) {
      const ratingNum = Number(rating);
      if (ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }

      order.buyerReview = {
        rating: ratingNum,
        comment: comment || '',
        createdAt: new Date(),
      };
      
      // Update product rating
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.reviews.push({
            user: order.buyer,
            userName: req.user.name,
            rating: ratingNum,
            review: comment || '',
            createdAt: new Date(),
          });
          product.updateRating();
          await product.save();
        }
      }
      
      // Update artisan rating in Artisan model
      const Artisan = (await import('../models/Artisan.js')).default;
      const artisan = await Artisan.findOne({ user: order.artisan });
      if (artisan) {
        artisan.reviews.push({
          buyer: order.buyer,
          buyerName: req.user.name,
          buyerAvatar: req.user.avatar?.url || '',
          rating: ratingNum,
          comment: comment || '',
          orderId: order._id,
          productId: order.items[0]?.product,
          isVerifiedPurchase: true,
          createdAt: new Date(),
        });
        artisan.updateRating();
        await artisan.save();
      }
    } else {
      order.buyerReview = null;
    }
    await order.save();

    // Notify artisan about review
    if (received && rating) {
      try {
        const io = req.app.get('io');
        if (io) {
          const payload = {
            orderId: order.orderId,
            buyerName: req.user.name,
            rating,
            comment: comment || '',
          };
          await Notification.create({
            user: order.artisan,
            userModel: 'User',
            type: 'new-review',
            title: '⭐ New Review Received!',
            body: `${req.user.name} rated your order ${rating}★`,
            data: payload
          });
          io.to(`user-${order.artisan}`).emit('new-review', payload);
        }
      } catch (e) { console.warn('Review notification failed:', e.message); }
    }

    res.json({ success: true, message: 'Delivery status confirmed', order });
  } catch (error) {
    console.error('Confirm received error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.artisan) !== String(req.user._id))
      return res.status(403).json({ message: 'Not authorized' });
    if (order.orderStatus !== 'delivered')
      return res.status(400).json({ message: 'Order must be delivered before confirming payment' });

    order.artisanReceivedPayment = true;
    order.paymentStatus = 'completed';
    await order.save();

    res.json({ success: true, message: 'Payment confirmed', order });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};