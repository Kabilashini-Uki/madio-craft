// pages/OrderTracking.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiPackage, FiTruck, FiCheckCircle, FiClock,
  FiArrowLeft, FiMapPin, FiCalendar, FiUser
} from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status) => {
    const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    return steps.indexOf(status);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <FiClock className="h-6 w-6" />;
      case 'confirmed': return <FiCheckCircle className="h-6 w-6" />;
      case 'processing': return <FiPackage className="h-6 w-6" />;
      case 'shipped': return <FiTruck className="h-6 w-6" />;
      case 'delivered': return <FiCheckCircle className="h-6 w-6" />;
      default: return <FiClock className="h-6 w-6" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const statusSteps = [
    { status: 'pending', label: 'Order Placed', date: order.createdAt },
    { status: 'confirmed', label: 'Order Confirmed', date: order.paymentInfo?.paidAt },
    { status: 'processing', label: 'Processing', date: order.processingAt },
    { status: 'shipped', label: 'Shipped', date: order.shippedAt },
    { status: 'delivered', label: 'Delivered', date: order.deliveredAt }
  ];

  const currentStep = getStatusStep(order.orderStatus);

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-6"
        >
          <FiArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            {/* Order Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderId}</h1>
                <p className="text-gray-600">Track your order status</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-700' :
                order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
              </span>
            </div>

            {/* Progress Tracker */}
            <div className="mb-12">
              <div className="flex justify-between">
                {statusSteps.map((step, index) => (
                  <div key={step.status} className="flex flex-col items-center relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                      index <= currentStep
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {getStatusIcon(step.status)}
                    </div>
                    <p className="text-sm font-medium mt-3 text-center">
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="text-xs text-gray-500 text-center">
                        {new Date(step.date).toLocaleDateString()}
                      </p>
                    )}
                    {index < statusSteps.length - 1 && (
                      <div className={`absolute top-6 left-12 w-full h-1 ${
                        index < currentStep ? 'bg-primary' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-6">
              {/* Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Items</h3>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
                      <img
                        src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/60'}
                        alt={item.product?.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.product?.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-gray-900">Rs{item.totalPrice}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="font-medium text-gray-900">{order.shippingAddress?.name}</p>
                    <p className="text-sm text-gray-600">{order.shippingAddress?.address}</p>
                    <p className="text-sm text-gray-600">
                      {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}
                    </p>
                    <p className="text-sm text-gray-600">{order.shippingAddress?.country}</p>
                    <p className="text-sm text-gray-600 mt-2">Phone: {order.shippingAddress?.phone}</p>
                  </div>
                </div>

                {/* Tracking Info */}
                {order.trackingNumber && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Tracking Information</h3>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-2">Tracking Number:</p>
                      <p className="font-medium text-gray-900 mb-3">{order.trackingNumber}</p>
                      {order.trackingUrl && (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 text-primary hover:text-primary-dark"
                        >
                          <FiTruck className="h-4 w-4" />
                          <span>Track Package</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">Rs{order.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">Rs{order.shippingCost || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">Rs{order.taxAmount || 0}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary">Rs{order.finalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 mt-8 pt-6 border-t">
              {order.orderStatus === 'delivered' && (
                <button className="flex-1 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark">
                  Write a Review
                </button>
              )}
              <button
                onClick={() => navigate(`/chat/${order.chatRoom}`)}
                className="flex-1 px-6 py-3 border-2 border-primary text-primary rounded-xl hover:bg-primary/5"
              >
                Contact Artisan
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;