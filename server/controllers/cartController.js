// controllers/cartController.js
import Cart    from '../models/Cart.js';
import Product from '../models/Product.js';

const SRI_LANKA_ZONES = {
  'Colombo': 'colombo', 'Gampaha': 'urban', 'Kalutara': 'urban',
  'Kandy': 'central', 'Matale': 'central', 'Nuwara Eliya': 'central',
  'Galle': 'southern', 'Matara': 'southern', 'Hambantota': 'southern',
  'Jaffna': 'northern', 'Kilinochchi': 'northern', 'Mannar': 'northern',
  'Mullaitivu': 'northern', 'Vavuniya': 'northern',
  'Batticaloa': 'eastern', 'Ampara': 'eastern', 'Trincomalee': 'eastern',
  'Kurunegala': 'north_western', 'Puttalam': 'north_western',
  'Anuradhapura': 'north_central', 'Polonnaruwa': 'north_central',
  'Badulla': 'uva', 'Moneragala': 'uva',
  'Ratnapura': 'sabaragamuwa', 'Kegalle': 'sabaragamuwa',
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart) {
      cart = new Cart({ user: userId, items: [], coupon: { code: null, discountType: null, discountValue: 0, minOrderAmount: 0, appliedAt: null } });
      await cart.save();
    }

    if (!cart.coupon || typeof cart.coupon !== 'object') {
      cart.coupon = { code: null, discountType: null, discountValue: 0, minOrderAmount: 0, appliedAt: null };
    }

    const deliveryEstimate = cart.getDeliveryEstimate?.() ?? {
      min: new Date(Date.now() + 3 * 86400000),
      max: new Date(Date.now() + 7 * 86400000),
      text: '3-7 business days',
    };

    res.json({
      success: true,
      cart: {
        _id: cart._id, items: cart.items, coupon: cart.coupon,
        subtotal: cart.subtotal, vat: cart.vat, nbt: cart.nbt, cess: cart.cess,
        shippingCost: cart.shippingCost, shippingZone: cart.shippingZone,
        deliveryMethod: cart.deliveryMethod, discount: cart.discount, total: cart.total,
        currency: 'LKR', hasFreeShipping: cart.subtotal >= 5000, deliveryEstimate,
      },
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, customization = null } = req.body;
    const userId = req.user.id;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ success: false, message: `Only ${product.stock} items available` });

    let price = product.price;
    if (customization?.options) {
      customization.options.forEach((opt) => { price += opt.priceAdjustment || 0; });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [], coupon: { code: null, discountType: null, discountValue: 0, minOrderAmount: 0, appliedAt: null } });
    }

    const existingIndex = cart.items.findIndex(
      (i) => i.product.toString() === productId.toString() && JSON.stringify(i.customization) === JSON.stringify(customization || {})
    );

    if (existingIndex >= 0) {
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (product.stock < newQty) return res.status(400).json({ success: false, message: `Cannot add more than ${product.stock} items` });
      cart.items[existingIndex].quantity   = newQty;
      cart.items[existingIndex].totalPrice = price * newQty;
    } else {
      cart.items.push({ product: productId, quantity, customization: customization || {}, price, totalPrice: price * quantity });
    }

    await cart.save();
    const populatedCart = await cart.populate('items.product');

    res.json({
      success: true, message: 'Added to cart successfully',
      cart: { _id: populatedCart._id, items: populatedCart.items, subtotal: populatedCart.subtotal, total: populatedCart.total, currency: 'LKR' },
    });
  } catch (error) {
    console.error('Cart add error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const updateShippingZone = async (req, res) => {
  try {
    const { district } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.shippingZone = SRI_LANKA_ZONES[district] || 'colombo';
    await cart.save();

    res.json({ success: true, message: 'Shipping zone updated', shippingZone: cart.shippingZone, shippingCost: cart.shippingCost, hasFreeShipping: cart.subtotal >= 5000 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDeliveryMethod = async (req, res) => {
  try {
    const { method } = req.body;
    if (!['standard', 'express', 'pickup'].includes(method)) return res.status(400).json({ success: false, message: 'Invalid delivery method' });

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.deliveryMethod = method;
    if (method === 'express')       cart.estimatedDeliveryDays = { min: 1, max: 2 };
    else if (method === 'pickup')  { cart.estimatedDeliveryDays = { min: 1, max: 1 }; cart.shippingCost = 0; }
    else                            cart.estimatedDeliveryDays = { min: 3, max: 7 };

    await cart.save();
    res.json({ success: true, message: 'Delivery method updated', deliveryMethod: method, shippingCost: cart.shippingCost, estimatedDeliveryDays: cart.estimatedDeliveryDays });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const validCoupons = {
      WELCOME10:  { discountType: 'percentage', discountValue: 10,  minOrderAmount: 1000, description: '10% off on orders above Rs. 1,000' },
      SAVE500:    { discountType: 'fixed',      discountValue: 500, minOrderAmount: 3000, description: 'Rs. 500 off on orders above Rs. 3,000' },
      FREESHIP:   { discountType: 'fixed',      discountValue: 0,   minOrderAmount: 2500, description: 'Free shipping on orders above Rs. 2,500', freeShipping: true },
      LANKACRAFT: { discountType: 'percentage', discountValue: 15,  minOrderAmount: 2000, description: '15% off on all handcrafted items' },
      AVURUDU:    { discountType: 'percentage', discountValue: 20,  minOrderAmount: 5000, description: 'Avurudu special - 20% off' },
      CEYLONTEA:  { discountType: 'fixed',      discountValue: 250, minOrderAmount: 1500, description: 'Rs. 250 off on your purchase' },
    };

    const couponCode = code.toUpperCase().trim();
    if (!validCoupons[couponCode]) return res.status(400).json({ success: false, message: 'Invalid coupon code' });

    const couponData = validCoupons[couponCode];
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    if (cart.subtotal < couponData.minOrderAmount) {
      return res.status(400).json({ success: false, message: `This coupon requires minimum order of Rs. ${couponData.minOrderAmount.toLocaleString()}` });
    }

    cart.coupon = { code: couponCode, discountType: couponData.discountType, discountValue: couponData.discountValue, minOrderAmount: couponData.minOrderAmount, appliedAt: new Date() };
    if (couponData.freeShipping) cart.shippingCost = 0;

    await cart.save();
    res.json({ success: true, message: 'Coupon applied successfully', coupon: { code: cart.coupon.code, discountType: cart.coupon.discountType, discountValue: cart.coupon.discountValue, description: couponData.description }, discount: cart.discount, total: cart.total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.coupon = { code: null, discountType: null, discountValue: 0, minOrderAmount: 0, appliedAt: null };
    await cart.save();

    res.json({ success: true, message: 'Coupon removed successfully', discount: 0, total: cart.total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { itemId }   = req.params;
    const { quantity } = req.body;

    if (quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const itemIndex = cart.items.findIndex((i) => i._id.toString() === itemId);
    if (itemIndex === -1) return res.status(404).json({ success: false, message: 'Item not found in cart' });

    const product = await Product.findById(cart.items[itemIndex].product);
    if (product?.stock < quantity) return res.status(400).json({ success: false, message: `Only ${product.stock} items available` });

    cart.items[itemIndex].quantity   = quantity;
    cart.items[itemIndex].totalPrice = cart.items[itemIndex].price * quantity;
    await cart.save();

    res.json({ success: true, message: 'Quantity updated', cart: { subtotal: cart.subtotal, total: cart.total, itemTotal: cart.items[itemIndex].totalPrice } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
    await cart.save();

    res.json({ success: true, message: 'Item removed from cart', cart: { items: cart.items, subtotal: cart.subtotal, total: cart.total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items  = [];
    cart.coupon = { code: null, discountType: null, discountValue: 0, minOrderAmount: 0, appliedAt: null };
    await cart.save();

    res.json({ success: true, message: 'Cart cleared', cart: { items: [], subtotal: 0, total: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
