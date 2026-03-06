// src/context/CartContext.js - Updated with wishlist functions
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]); // Add wishlist state
  const [loading, setLoading] = useState(false);
  const [cartSummary, setCartSummary] = useState({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    itemCount: 0
  });

  // Load cart and wishlist from localStorage for guests, or from API for logged-in users
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCartFromAPI();
      loadWishlistFromAPI(); // Load wishlist for authenticated users
    } else {
      loadCartFromLocalStorage();
      loadWishlistFromLocalStorage(); // Load wishlist for guests
    }
  }, [isAuthenticated, user]);

  const loadCartFromLocalStorage = () => {
    try {
      const savedCart = localStorage.getItem('madiocraft_cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Error loading cart from storage:', e);
    }
  };

  const loadWishlistFromLocalStorage = () => {
    try {
      const savedWishlist = localStorage.getItem('madiocraft_wishlist');
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    } catch (e) {
      console.error('Error loading wishlist from storage:', e);
    }
  };

  const loadCartFromAPI = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      if (response.data.success) {
        const items = response.data.cart?.items || [];
        setCartItems(items);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      loadCartFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadWishlistFromAPI = async () => {
    try {
      const response = await api.get('/users/wishlist');
      if (response.data.success) {
        setWishlist(response.data.wishlist || []);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      loadWishlistFromLocalStorage();
    }
  };

  // Recalculate summary whenever cart items change
  useEffect(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Simple shipping: Free over Rs. 999, otherwise Rs. 99
    const shipping = subtotal > 999 ? 0 : 99;
    
    // No tax applied
    const tax = 0;
    
    const total = subtotal + shipping;
    
    setCartSummary({
      subtotal,
      shipping,
      tax,
      total,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    });

    // Save to localStorage for guests
    if (!isAuthenticated) {
      localStorage.setItem('madiocraft_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);

  // Wishlist functions
  const isInWishlist = useCallback((productId) => {
    return wishlist.some(item => 
      (item._id === productId) || (item.product?._id === productId) || (item.id === productId)
    );
  }, [wishlist]);

  const addToWishlist = useCallback(async (product) => {
    try {
      if (isAuthenticated) {
        const response = await api.post('/users/wishlist/add', { productId: product._id });
        if (response.data.success) {
          await loadWishlistFromAPI();
          toast.success('Added to wishlist!');
          return true;
        }
      } else {
        // For guests, store in localStorage
        const wishlistItem = {
          _id: product._id,
          name: product.name,
          price: product.price,
          images: product.images,
          artisan: product.artisan
        };
        
        setWishlist(prev => {
          // Check if already in wishlist
          if (prev.some(item => item._id === product._id)) {
            toast.error('Already in wishlist');
            return prev;
          }
          toast.success('Added to wishlist!');
          return [...prev, wishlistItem];
        });
        
        localStorage.setItem('madiocraft_wishlist', JSON.stringify([...wishlist, wishlistItem]));
        return true;
      }
    } catch (error) {
      toast.error('Failed to add to wishlist');
      return false;
    }
  }, [isAuthenticated, wishlist]);

  const removeFromWishlist = useCallback(async (productId) => {
    try {
      if (isAuthenticated) {
        const response = await api.delete(`/users/wishlist/${productId}`);
        if (response.data.success) {
          await loadWishlistFromAPI();
          toast.success('Removed from wishlist');
          return true;
        }
      } else {
        setWishlist(prev => {
          const updated = prev.filter(item => item._id !== productId);
          localStorage.setItem('madiocraft_wishlist', JSON.stringify(updated));
          toast.success('Removed from wishlist');
          return updated;
        });
        return true;
      }
    } catch (error) {
      toast.error('Failed to remove from wishlist');
      return false;
    }
  }, [isAuthenticated]);

  const addToCart = useCallback(async (product, customization = null, quantity = 1) => {
    setLoading(true);
    try {
      let price = product.price;
      
      // Add customization price adjustments if any
      if (customization?.options) {
        customization.options.forEach(opt => {
          price += opt.priceAdjustment || 0;
        });
      }

      if (isAuthenticated) {
        // API call for logged-in users
        const response = await api.post('/cart/add', {
          productId: product._id,
          quantity,
          customization
        });
        
        if (response.data.success) {
          await loadCartFromAPI();
          toast.success('Added to cart!');
          return true;
        }
      } else {
        // Local storage for guests
        const cartItem = {
          id: `${product._id}-${Date.now()}`,
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            images: product.images,
            artisan: product.artisan
          },
          customization,
          quantity,
          price,
          addedAt: new Date().toISOString()
        };
        
        setCartItems(prev => {
          // Check if same product with same customization exists
          const existingIndex = prev.findIndex(item => 
            item.product._id === product._id &&
            JSON.stringify(item.customization) === JSON.stringify(customization)
          );
          
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex].quantity += quantity;
            updated[existingIndex].price = price;
            return updated;
          }
          
          return [...prev, cartItem];
        });
        
        toast.success('Added to cart!');
        return true;
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to add to cart');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const updateQuantity = useCallback(async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    
    try {
      if (isAuthenticated) {
        await api.put(`/cart/update/${itemId}`, { quantity: newQuantity });
        await loadCartFromAPI();
      } else {
        setCartItems(prev => 
          prev.map(item => 
            (item.id === itemId || item._id === itemId) 
              ? { ...item, quantity: newQuantity } 
              : item
          )
        );
      }
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  }, [isAuthenticated]);

  const removeFromCart = useCallback(async (itemId) => {
    try {
      if (isAuthenticated) {
        await api.delete(`/cart/remove/${itemId}`);
        await loadCartFromAPI();
      } else {
        setCartItems(prev => prev.filter(item => item.id !== itemId && item._id !== itemId));
      }
      toast.success('Item removed');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  }, [isAuthenticated]);

  const clearCart = useCallback(async () => {
    try {
      if (isAuthenticated) {
        await api.delete('/cart/clear');
      }
      setCartItems([]);
      localStorage.removeItem('madiocraft_cart');
      toast.success('Cart cleared');
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  }, [isAuthenticated]);

  const value = {
    cartItems,
    loading,
    cartSummary,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount: cartSummary.itemCount,
    // Add wishlist functions and state
    wishlist,
    isInWishlist,
    addToWishlist,
    removeFromWishlist
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};