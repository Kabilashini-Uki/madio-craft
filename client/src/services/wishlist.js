// src/services/wishlist.js
import api from './api';

export const wishlistService = {
  // Get user's wishlist
  getWishlist: async () => {
    try {
      const response = await api.get('/users/wishlist');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add to wishlist
  addToWishlist: async (productId) => {
    try {
      const response = await api.post('/users/wishlist/add', { productId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Remove from wishlist
  removeFromWishlist: async (productId) => {
    try {
      const response = await api.delete(`/users/wishlist/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Check if product is in wishlist
  checkInWishlist: async (productId) => {
    try {
      const response = await api.get(`/users/wishlist/check/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};