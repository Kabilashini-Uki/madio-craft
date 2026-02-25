const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }

    console.log('Cart retrieved:', { userId, itemCount: cart.items.length });

    res.json({
      success: true,
      cart: {
        _id: cart._id,
        items: cart.items,
        coupon: cart.coupon,
        subtotal: cart.subtotal,
        tax: cart.tax,
        shipping: cart.shipping,
        discount: cart.discount,
        total: cart.total
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, customization = null } = req.body;
    const userId = req.user.id;

    console.log('Adding to cart:', { productId, quantity, userId });

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found:', productId);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Calculate price
    let price = product.price;
    if (customization && customization.options) {
      customization.options.forEach(opt => {
        price += opt.priceAdjustment || 0;
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already exists in cart with same customization
    const existingItemIndex = cart.items.findIndex(item =>
      item.product.toString() === productId.toString() &&
      JSON.stringify(item.customization) === JSON.stringify(customization || {})
    );

    if (existingItemIndex >= 0) {
      // Update quantity if same product with same customization
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].totalPrice = cart.items[existingItemIndex].price * cart.items[existingItemIndex].quantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        customization: customization || {},
        price,
        totalPrice: price * quantity
      });
    }

    await cart.save();
    const populatedCart = await cart.populate('items.product');

    console.log('Cart saved successfully:', { itemCount: cart.items.length });

    res.json({
      success: true,
      message: 'Added to cart successfully',
      cart: {
        _id: populatedCart._id,
        items: populatedCart.items,
        coupon: populatedCart.coupon,
        subtotal: populatedCart.subtotal,
        tax: populatedCart.tax,
        shipping: populatedCart.shipping,
        discount: populatedCart.discount,
        total: populatedCart.total
      }
    });
  } catch (error) {
    console.error('Cart add error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Update cart item quantity
exports.updateQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].totalPrice = cart.items[itemIndex].price * quantity;

    await cart.save();
    const populatedCart = await cart.populate('items.product');

    res.json({
      success: true,
      message: 'Quantity updated',
      cart: {
        _id: populatedCart._id,
        items: populatedCart.items,
        coupon: populatedCart.coupon,
        subtotal: populatedCart.subtotal,
        tax: populatedCart.tax,
        shipping: populatedCart.shipping,
        discount: populatedCart.discount,
        total: populatedCart.total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();
    const populatedCart = await cart.populate('items.product');

    res.json({
      success: true,
      message: 'Item removed from cart',
      cart: {
        _id: populatedCart._id,
        items: populatedCart.items,
        coupon: populatedCart.coupon,
        subtotal: populatedCart.subtotal,
        tax: populatedCart.tax,
        shipping: populatedCart.shipping,
        discount: populatedCart.discount,
        total: populatedCart.total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = [];
    cart.coupon = { code: null, type: null, value: 0 };
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared',
      cart: {
        _id: cart._id,
        items: [],
        coupon: cart.coupon,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Apply coupon
exports.applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    // Mock coupon database (replace with real DB in production)
    const validCoupons = {
      'WELCOME10': { type: 'percentage', value: 10 },
      'SAVE50': { type: 'fixed', value: 50 },
      'MADIO20': { type: 'percentage', value: 20 },
      'ARTISAN100': { type: 'fixed', value: 100 }
    };

    if (!validCoupons[code.toUpperCase()]) {
      return res.status(400).json({ success: false, message: 'Invalid coupon code' });
    }

    const couponData = validCoupons[code.toUpperCase()];
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.coupon = {
      code: code.toUpperCase(),
      type: couponData.type,
      value: couponData.value,
      appliedAt: new Date()
    };

    await cart.save();

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      coupon: cart.coupon,
      total: cart.total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove coupon
exports.removeCoupon = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.coupon = { code: null, type: null, value: 0 };
    await cart.save();

    res.json({
      success: true,
      message: 'Coupon removed',
      cart: {
        _id: cart._id,
        items: cart.items,
        coupon: cart.coupon,
        subtotal: cart.subtotal,
        tax: cart.tax,
        shipping: cart.shipping,
        discount: cart.discount,
        total: cart.total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
