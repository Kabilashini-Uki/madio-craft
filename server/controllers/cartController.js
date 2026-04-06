// controllers/cartController.js
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';



export const getCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }

    // Filter out items where product is null (deleted products)
    const validItems = cart.items.filter(item => item.product != null);
    
    // If some items were removed, update the cart
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.json({
      success: true,
      cart: {
        _id: cart._id, 
        items: validItems,
        subtotal: cart.subtotal, 
        vat: cart.vat, 
        nbt: cart.nbt, 
        cess: cart.cess,
        total: cart.total,
        currency: 'LKR',
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
    const userId = req.user._id || req.user.id;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.artisan && product.artisan.toString() === userId.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot buy your own products' });
    }
    if (product.stock < quantity) return res.status(400).json({ success: false, message: `Only ${product.stock} items available` });

    let price = product.price;
    if (customization?.price && Number(customization.price) > 0) {
      price = Number(customization.price);
    } else if (customization?.options) {
      customization.options.forEach((opt) => { price += opt.priceAdjustment || 0; });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (i) => i.product.toString() === productId.toString() && JSON.stringify(i.customization) === JSON.stringify(customization || {})
    );

    if (existingIndex >= 0) {
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (product.stock < newQty) return res.status(400).json({ success: false, message: `Cannot add more than ${product.stock} items` });
      cart.items[existingIndex].quantity = newQty;
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



export const updateQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id || req.user.id;

    if (quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const itemIndex = cart.items.findIndex((i) => i._id.toString() === itemId);
    if (itemIndex === -1) return res.status(404).json({ success: false, message: 'Item not found in cart' });

    const product = await Product.findById(cart.items[itemIndex].product);
    if (product?.stock < quantity) return res.status(400).json({ success: false, message: `Only ${product.stock} items available` });

    cart.items[itemIndex].quantity = quantity;
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
    const userId = req.user._id || req.user.id;
    
    console.log(`Removing item ${itemId} from cart for user ${userId}`);
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
    
    if (cart.items.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
    
    await cart.save();

    // Populate the cart items before sending response
    const populatedCart = await cart.populate('items.product');

    res.json({ 
      success: true, 
      message: 'Item removed from cart', 
      cart: { 
        items: populatedCart.items, 
        subtotal: populatedCart.subtotal, 
        vat: populatedCart.vat,
        nbt: populatedCart.nbt,
        cess: populatedCart.cess,
        total: populatedCart.total 
      } 
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = [];
    await cart.save();

    res.json({ success: true, message: 'Cart cleared', cart: { items: [], subtotal: 0, total: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
