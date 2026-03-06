// pages/OrderConfirmation.js
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheckCircle, FiPackage, FiTruck, FiMapPin, FiArrowRight,
  FiHome, FiShoppingBag, FiClock, FiPhone, FiStar, FiX, FiSend
} from 'react-icons/fi';
import { useOrders } from '../context/OrderContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const StarPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map(star => (
      <button key={star} onClick={() => onChange(star)} type="button"
        className="transition-transform hover:scale-125">
        <FiStar className={`h-7 w-7 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
      </button>
    ))}
  </div>
);

const ReviewModal = ({ item, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    try {
      await onSubmit(item.product?._id, rating, comment);
      toast.success('Review submitted! Thank you.');
      onClose();
    } catch (e) {
      toast.error('Failed to submit review');
    } finally { setSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Rate & Review</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-2xl">
          <img src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/60'} alt=""
            className="w-14 h-14 rounded-xl object-cover" />
          <div>
            <p className="font-semibold text-gray-900">{item.product?.name || 'Product'}</p>
            <p className="text-sm text-gray-500">How was it?</p>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Your Rating</p>
          <StarPicker value={rating} onChange={setRating} />
          {rating > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 block mb-2">Your Review (optional)</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none resize-none text-sm" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
            Skip
          </button>
          <button onClick={handleSubmit} disabled={submitting || !rating}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark disabled:opacity-60">
            {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <><FiSend className="h-4 w-4" /> Submit</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const OrderConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrder } = useOrders();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewedProducts, setReviewedProducts] = useState(new Set());

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrder(id);
        setOrder(data);
      } catch (e) {
        console.error('Error fetching order:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const steps = [
    { icon: <FiCheckCircle />, label: 'Order Placed', done: true },
    { icon: <FiPackage />, label: 'Processing', done: false },
    { icon: <FiTruck />, label: 'Shipped', done: false },
    { icon: <FiMapPin />, label: 'Delivered', done: false },
  ];

  const handleSubmitReview = async (productId, rating, comment) => {
    await api.post(`/products/${productId}/reviews`, { rating, comment });
    setReviewedProducts(prev => new Set([...prev, productId]));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Success Header */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }} className="text-center py-12">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="h-12 w-12 text-green-500" />
          </motion.div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-3">Order Confirmed! 🎉</h1>
          <p className="text-gray-600 text-lg">Thank you for your purchase. Your artisan has been notified.</p>
          {order && (
            <div className="mt-4 inline-block px-6 py-2 bg-primary/10 text-primary rounded-full font-medium">
              Order ID: {order.orderId || order._id?.slice(-8).toUpperCase()}
            </div>
          )}
        </motion.div>

        {/* Order Tracking Steps */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Order Status</h2>
          <div className="flex items-start justify-between">
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2 ${step.done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {step.icon}
                  </div>
                  <span className={`text-xs font-medium ${step.done ? 'text-green-600' : 'text-gray-400'}`}>{step.label}</span>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 mt-5 mx-2 ${step.done ? 'bg-green-300' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        {/* Order Items with Review Buttons */}
        {order && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FiPackage className="mr-2 text-primary" /> Order Items
            </h2>
            <div className="space-y-4">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center space-x-4 pb-4 border-b last:border-0">
                  <img src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/80'}
                    alt={item.product?.name} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.product?.name || 'Product'}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">Rs. {item.totalPrice?.toLocaleString()}</p>
                    {item.product?._id && !reviewedProducts.has(item.product._id) ? (
                      <button onClick={() => setReviewItem(item)}
                        className="mt-1 text-xs text-primary hover:underline flex items-center gap-1">
                        <FiStar className="h-3 w-3" /> Rate this
                      </button>
                    ) : reviewedProducts.has(item.product?._id) ? (
                      <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <FiCheckCircle className="h-3 w-3" /> Reviewed
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between font-bold text-lg">
              <span>Total Paid</span>
              <span className="text-primary">Rs. {order.finalAmount?.toLocaleString()}</span>
            </div>
          </motion.div>
        )}

        {/* Shipping Info */}
        {order && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FiMapPin className="mr-2 text-primary" /> Delivering To
            </h2>
            <p className="font-semibold text-gray-800">{order.shippingAddress?.name}</p>
            <p className="text-gray-600">{order.shippingAddress?.address}</p>
            <p className="text-gray-600">
              {order.shippingAddress?.city}, {order.shippingAddress?.district} – {order.shippingAddress?.zipCode}
            </p>
            {order.shippingAddress?.phone && (
              <p className="text-gray-600 flex items-center mt-1">
                <FiPhone className="mr-1 h-4 w-4" />{order.shippingAddress.phone}
              </p>
            )}
            <div className="mt-4 flex items-center space-x-2 text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-xl">
              <FiClock className="h-4 w-4" />
              <span>Estimated delivery: 3–5 business days</span>
            </div>
          </motion.div>
        )}

        {/* Rate & Review Prompt */}
        {order && order.items?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiStar className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Share Your Experience!</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Your reviews help other buyers and support our artisans. Rate your purchased items above.
                </p>
                <div className="flex flex-wrap gap-2">
                  {order.items?.filter(item => item.product?._id && !reviewedProducts.has(item.product._id)).map((item, i) => (
                    <button key={i} onClick={() => setReviewItem(item)}
                      className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-full hover:bg-amber-700 transition-colors flex items-center gap-1">
                      <FiStar className="h-3 w-3" /> Rate {item.product?.name?.slice(0, 15) || 'Product'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4">
          <Link to="/dashboard"
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors">
            <FiPackage /><span>View My Orders</span>
          </Link>
          <Link to="/products"
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
            <FiShoppingBag /><span>Continue Shopping</span>
          </Link>
          <Link to="/"
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
            <FiHome /><span>Home</span>
          </Link>
        </motion.div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewItem && (
          <ReviewModal
            item={reviewItem}
            onClose={() => setReviewItem(null)}
            onSubmit={handleSubmitReview}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderConfirmation;
