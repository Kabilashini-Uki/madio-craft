// src/context/OrderContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const OrderContext = createContext();

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
};

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const loadOrders = useCallback(async (page = 1, status = 'all') => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (status !== 'all') params.status = status;
      
      console.log('Loading orders with params:', params);
      const response = await api.get('/orders/my-orders', { params });
      console.log('Orders response:', response.data);
      
      if (response.data.success) {
        setOrders(response.data.orders || []);
        if (response.data.pagination) setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = async (orderData) => {
    setLoading(true);
    try {
      console.log('🚀 Creating order with data:', JSON.stringify(orderData, null, 2));
      
      // Validate required fields
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('No items in order');
      }
      
      if (!orderData.shippingAddress) {
        throw new Error('Shipping address is required');
      }
      
      // Make sure all numeric values are numbers
      const sanitizedData = {
        ...orderData,
        subtotal: Number(orderData.subtotal) || 0,
        shippingCost: Number(orderData.shippingCost) || 0,
        vat: Number(orderData.vat) || 0,
        nbt: Number(orderData.nbt) || 0,
        discount: Number(orderData.discount) || 0,
        totalAmount: Number(orderData.totalAmount) || 0
      };
      
      console.log('📤 Sending sanitized data to server:', sanitizedData);
      
      const response = await api.post('/orders', sanitizedData);
      
      console.log('📥 Server response:', response.data);
      
      if (response.data.success) {
        setCurrentOrder(response.data.order);
        toast.success(response.data.message || 'Order created successfully!');
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('❌ Create order error in context:', error);
      
      // Log detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        const errorMessage = error.response.data?.message || 
                            error.response.data?.error || 
                            `Server error: ${error.response.status}`;
        toast.error(errorMessage);
        throw new Error(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        toast.error('No response from server. Please check your connection.');
        throw new Error('Network error - no response from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        toast.error(error.message || 'Failed to create order');
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const getOrder = async (orderId) => {
    setLoading(true);
    try {
      console.log('Getting order:', orderId);
      const response = await api.get(`/orders/${orderId}`);
      console.log('Order response:', response.data);
      
      if (response.data.success) {
        setCurrentOrder(response.data.order);
        return response.data.order;
      }
    } catch (error) {
      console.error('Failed to load order:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId, reason) => {
    setLoading(true);
    try {
      const response = await api.put(`/orders/${orderId}/cancel`, { reason });
      console.log('Cancel order response:', response.data);
      
      if (response.data.success) {
        setOrders(prev => prev.map(o => 
          o._id === orderId ? { ...o, orderStatus: 'cancelled' } : o
        ));
        toast.success('Order cancelled successfully');
        return true;
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Could not cancel order');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Test function to verify API connectivity
  const testOrderApi = async () => {
    try {
      console.log('Testing order API...');
      const response = await api.get('/orders/test');
      console.log('Test response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Test API error:', error);
      throw error;
    }
  };

  const value = {
    orders,
    currentOrder,
    loading,
    pagination,
    loadOrders,
    createOrder,
    getOrder,
    cancelOrder,
    testOrderApi
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};