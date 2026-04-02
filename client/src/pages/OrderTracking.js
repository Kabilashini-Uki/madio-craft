// pages/OrderTracking.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiPackage, FiTruck, FiCheckCircle, FiClock,
  FiArrowLeft
} from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
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
    fetchOrder();
  }, [orderId]);

  const getStatusStep = (status) => {
    const steps = ['pending', 'confirmed', 'processing', 'delivered'];
    return steps.indexOf(status);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="h-6 w-6" />;
      case 'confirmed': return <FiCheckCircle className="h-6 w-6" />;
      case 'processing': return <FiPackage className="h-6 w-6" />;
      case 'delivered': return <FiCheckCircle className="h-6 w-6" />;
      default: return <FiClock className="h-6 w-6" />;
    }
  };

  const refreshOrderFromServer = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data?.order || response.data?.order || response.data);
    } catch (e) {
      // Non-critical: keep the current UI.
      console.error('Failed to refresh order:', e);
    }
  };

  const handleNotReceived = async () => {
    try {
      const response = await api.post(`/orders/${order._id}/confirm-received`, { received: false });
      setOrder(response.data?.order || response.data);
      toast.success('Marked as not received. The artisan has been notified.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update status');
    } finally {
      setReviewOpen(false);
    }
  };

  const handleSubmitReview = async () => {
    const comment = reviewComment.trim();
    if (!comment) {
      toast.error('Please write your feedback');
      return;
    }
    try {
      const response = await api.post(`/orders/${order._id}/confirm-received`, {
        received: true,
        comment,
      });
      setOrder(response.data?.order || response.data);
      setReviewOpen(false);
      setReviewComment('');
      toast.success('Feedback submitted. Thank you!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setReviewOpen(false);
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
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
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
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${index <= currentStep
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
                      <div className={`absolute top-6 left-12 w-full h-1 ${index < currentStep ? 'bg-primary' : 'bg-gray-200'
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
              </div>

              {/* Order Summary */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">Rs{order.totalAmount}</span>
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
              {order.orderStatus === 'delivered' && order.buyerReceived == null && (
                <>
                  <button
                    onClick={() => setReviewOpen(true)}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark"
                  >
                    Product Received
                  </button>
                  <button
                    onClick={handleNotReceived}
                    className="flex-1 px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                  >
                    Not Received
                  </button>
                </>
              )}
              {order.orderStatus === 'delivered' && order.buyerReceived === true && (
                <span className="flex-1 px-6 py-3 bg-green-50 text-green-700 rounded-xl text-center font-medium">
                  Received
                </span>
              )}
              {order.orderStatus === 'delivered' && order.buyerReceived === false && (
                <span className="flex-1 px-6 py-3 bg-red-50 text-red-700 rounded-xl text-center font-medium">
                  Reported Not Received
                </span>
              )}
              <button
                onClick={() => navigate(`/chat/${order.chatRoom}`)}
                className="flex-1 px-6 py-3 border-2 border-primary text-primary rounded-xl hover:bg-primary/5"
              >
                Contact Artisan
              </button>
            </div>
          </motion.div>

          {/* Review Modal (no rating system) */}
          {reviewOpen && (
            <div
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setReviewOpen(false)}
            >
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Write Feedback</h3>
                <p className="text-gray-500 text-sm mb-5">
                  Private feedback for {order?.artisan?.name || 'the artisan'}
                </p>

                <div className="mb-5">
                  <p className="font-medium text-sm mb-2">Your Feedback</p>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows={5}
                    className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setReviewOpen(false)}
                    className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={false}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark"
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;