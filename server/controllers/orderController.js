const Order = require('../models/Order');
const Product = require('../models/Product');
const { ChatRoom } = require('../models/ChatRoom');
const crypto = require('crypto');

// Initialize Razorpay only if credentials exist
let razorpayInstance = null;

try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const Razorpay = require('razorpay');
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('✓ Razorpay initialized successfully');
  } else {
    console.log('⚠ Razorpay credentials not found. Payment functionality disabled.');
  }
} catch (error) {
  console.error('Failed to initialize Razorpay:', error.message);
}

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, notes } = req.body;
    const buyer = req.user.id;

    // Calculate total amount and validate items
    let totalAmount = 0;
    let artisanId = null;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({ 
          message: `Product ${item.product} not available` 
        });
      }

      // Set artisan ID (all items should be from same artisan)
      if (!artisanId) {
        artisanId = product.artisan;
      } else if (artisanId.toString() !== product.artisan.toString()) {
        return res.status(400).json({ 
          message: 'All items must be from the same artisan' 
        });
      }

      // Calculate item total with customizations
      let itemTotal = product.price * item.quantity;
      if (item.customization && item.customization.options) {
        item.customization.options.forEach(opt => {
          itemTotal += opt.priceAdjustment || 0;
        });
      }

      totalAmount += itemTotal;
    }

    // Mock Razorpay order if not configured
    let razorpayOrder = null;
    if (razorpayInstance) {
      razorpayOrder = await razorpayInstance.orders.create({
        amount: totalAmount * 100, // Convert to paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`
      });
    } else {
      // Create mock order for development
      razorpayOrder = {
        id: `mock_order_${Date.now()}`,
        amount: totalAmount * 100,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        status: 'created'
      };
    }

    // Create order in database
    const order = await Order.create({
      buyer,
      artisan: artisanId,
      items,
      shippingAddress,
      notes,
      totalAmount,
      finalAmount: totalAmount,
      paymentInfo: {
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        currency: 'INR',
        status: 'pending'
      }
    });

    // Create chat room for this order
    const chatRoom = await ChatRoom.create({
      participants: [buyer, artisanId],
      order: order._id,
      product: items[0]?.product
    });

    // Update order with chat room
    order.chatRoom = chatRoom._id;
    await order.save();

    res.status(201).json({
      success: true,
      order,
      razorpayOrder,
      chatRoom: chatRoom._id,
      note: razorpayInstance ? null : 'Payment is in test mode (Razorpay not configured)'
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Verify payment
// @route   POST /api/orders/verify-payment
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // If Razorpay not configured, simulate successful payment
    if (!razorpayInstance) {
      const order = await Order.findOne({ 
        'paymentInfo.razorpayOrderId': razorpay_order_id 
      });

      if (order) {
        order.paymentInfo.razorpayPaymentId = razorpay_payment_id || `mock_payment_${Date.now()}`;
        order.paymentInfo.razorpaySignature = razorpay_signature || 'mock_signature';
        order.paymentInfo.status = 'completed';
        order.paymentInfo.paidAt = new Date();
        order.orderStatus = 'confirmed';

        await order.save();

        return res.json({
          success: true,
          message: 'Payment verified successfully (test mode)',
          order,
          isTestMode: true
        });
      } else {
        return res.status(404).json({ message: 'Order not found' });
      }
    }

    // Actual Razorpay verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Update order status
      const order = await Order.findOne({ 
        'paymentInfo.razorpayOrderId': razorpay_order_id 
      });

      if (order) {
        order.paymentInfo.razorpayPaymentId = razorpay_payment_id;
        order.paymentInfo.razorpaySignature = razorpay_signature;
        order.paymentInfo.status = 'completed';
        order.paymentInfo.paidAt = new Date();
        order.orderStatus = 'confirmed';

        await order.save();

        res.json({
          success: true,
          message: 'Payment verified successfully',
          order
        });
      } else {
        res.status(404).json({ message: 'Order not found' });
      }
    } else {
      res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate('artisan', 'name avatar')
      .populate('items.product', 'name images')
      .sort('-createdAt');

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get artisan orders
// @route   GET /api/orders/artisan-orders
// @access  Private/Artisan
exports.getArtisanOrders = async (req, res) => {
  try {
    const orders = await Order.find({ artisan: req.user.id })
      .populate('buyer', 'name avatar')
      .populate('items.product', 'name images')
      .sort('-createdAt');

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Artisan
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, trackingUrl } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is the artisan
    if (order.artisan.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    order.orderStatus = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (trackingUrl) order.trackingUrl = trackingUrl;
    if (status === 'shipped') order.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await order.save();

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Test endpoint
// @route   GET /api/orders/test
// @access  Public
exports.test = (req, res) => {
  res.json({
    success: true,
    message: 'Orders route is working',
    razorpayConfigured: !!razorpayInstance
  });
};