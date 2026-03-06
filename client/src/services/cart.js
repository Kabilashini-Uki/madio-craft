// src/services/cart.js
import api from './api';

export const cartService = {
  // Get cart items
  getCart: async () => {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add to cart
  addToCart: async (productId, quantity = 1, customization = null) => {
    try {
      const response = await api.post('/cart/add', {
        productId,
        quantity,
        customization
      });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to add to cart';
      console.error('Cart service error:', { status: error.response?.status, data: error.response?.data, message: errorMsg });
      throw { message: errorMsg, status: error.response?.status, data: error.response?.data };
    }
  },

  // Update quantity
  updateQuantity: async (itemId, quantity) => {
    try {
      const response = await api.put(`/cart/update/${itemId}`, { quantity });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Remove from cart
  removeFromCart: async (itemId) => {
    try {
      const response = await api.delete(`/cart/remove/${itemId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Clear cart
  clearCart: async () => {
    try {
      const response = await api.delete('/cart/clear');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Apply coupon
  applyCoupon: async (code) => {
    try {
      const response = await api.post('/cart/apply-coupon', { code });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Remove coupon
  removeCoupon: async () => {
    try {
      const response = await api.delete('/cart/remove-coupon');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};