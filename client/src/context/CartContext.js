import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('madiocraft_cart');
    const savedWishlist = localStorage.getItem('madiocraft_wishlist');
    
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('madiocraft_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('madiocraft_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Add to cart
  const addToCart = (product, customization = null, quantity = 1) => {
    const existingItem = cartItems.find(item => 
      item.product._id === product._id && 
      JSON.stringify(item.customization) === JSON.stringify(customization)
    );

    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.product._id === product._id && 
        JSON.stringify(item.customization) === JSON.stringify(customization)
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        product,
        customization,
        quantity,
        price: calculateItemPrice(product, customization)
      }]);
    }
  };

  // Remove from cart
  const removeFromCart = (itemId) => {
    setCartItems(cartItems.filter((_, index) => index !== itemId));
  };

  // Update quantity
  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    
    setCartItems(cartItems.map((item, index) =>
      index === itemId ? { ...item, quantity } : item
    ));
  };

  // Calculate total
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => 
      total + (item.price * item.quantity), 0
    );
  };

  // Calculate item price with customizations
  const calculateItemPrice = (product, customization) => {
    let price = product.price;
    
    if (customization && customization.options) {
      customization.options.forEach(opt => {
        price += opt.priceAdjustment || 0;
      });
    }
    
    return price;
  };

  // Wishlist functions
  const addToWishlist = (product) => {
    if (!wishlist.some(item => item._id === product._id)) {
      setWishlist([...wishlist, product]);
    }
  };

  const removeFromWishlist = (productId) => {
    setWishlist(wishlist.filter(item => item._id !== productId));
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item._id === productId);
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  const value = {
    cartItems,
    wishlist,
    addToCart,
    removeFromCart,
    updateQuantity,
    calculateTotal,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearCart,
    cartCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};