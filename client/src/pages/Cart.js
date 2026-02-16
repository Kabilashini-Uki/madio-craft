// pages/Cart.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiTrash2, 
  FiPlus, 
  FiMinus, 
  FiArrowLeft, 
  FiShoppingBag,
  FiShield,
  FiTruck,
  FiRefreshCw,
  FiTag 
} from 'react-icons/fi';

const Cart = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Handcrafted Ceramic Vase',
      artisan: 'Clay Creations',
      price: 1899,
      originalPrice: 2499,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=500',
      customizable: true,
      estimatedDelivery: '5-7 days'
    },
    {
      id: 2,
      name: 'Wooden Carved Bowl Set',
      artisan: 'Woodcraft Artisans',
      price: 3299,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500',
      customizable: false,
      estimatedDelivery: '3-5 days'
    },
    {
      id: 3,
      name: 'Silver Filigree Earrings',
      artisan: 'Silver Smith',
      price: 2450,
      originalPrice: 3200,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500',
      customizable: true,
      estimatedDelivery: '7-10 days'
    }
  ]);

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const updateQuantity = (id, change) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const savings = cartItems.reduce((sum, item) => 
    sum + ((item.originalPrice || item.price) - item.price) * item.quantity, 0
  );
  const shipping = subtotal > 999 ? 0 : 99;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  const applyCoupon = () => {
    if (couponCode.toLowerCase() === 'welcome10') {
      setCouponApplied(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">
                Shopping Cart
              </h1>
              <p className="text-gray-600">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
              </p>
            </motion.div>
            
            <Link
              to="/products"
              className="group flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-primary transition-colors"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center py-16"
          >
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiShoppingBag className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any treasures to your cart yet.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
              <span>Start Shopping</span>
              <FiArrowRight />
            </Link>
          </motion.div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex flex-col sm:flex-row gap-6">
                      {/* Product Image */}
                      <div className="sm:w-32 h-32 rounded-xl overflow-hidden bg-gray-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              by {item.artisan}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {item.customizable && (
                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                              ✨ Customizable
                            </span>
                          )}
                          {item.originalPrice && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Save Rs{item.originalPrice - item.price}
                            </span>
                          )}
                        </div>

                        {/* Quantity and Price */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-600">Qty:</span>
                            <div className="flex items-center border border-gray-200 rounded-lg">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-l-lg transition-colors"
                              >
                                <FiMinus className="h-3 w-3" />
                              </button>
                              <span className="w-10 text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-r-lg transition-colors"
                              >
                                <FiPlus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900">
                              Rs{item.price * item.quantity}
                            </div>
                            {item.originalPrice && (
                              <div className="text-sm text-gray-400 line-through">
                                Rs{item.originalPrice * item.quantity}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Delivery Estimate */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center text-sm text-gray-600">
                            <FiTruck className="h-4 w-4 mr-2" />
                            Estimated delivery: {item.estimatedDelivery}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6 sticky top-24"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Order Summary
                </h2>

                {/* Coupon */}
                <div className="mb-6">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-grow px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={couponApplied}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {couponApplied && (
                    <div className="mt-2 text-sm text-green-600 flex items-center">
                      <FiTag className="h-4 w-4 mr-1" />
                      Welcome10 applied - 10% off
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>Rs{subtotal.toLocaleString()}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Savings</span>
                      <span>-Rs{savings.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (18% GST)</span>
                    <span>Rs{Math.round(tax).toLocaleString()}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount (WELCOME10)</span>
                      <span>-Rs{Math.round(subtotal * 0.1).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>Rs{Math.round(total - (couponApplied ? subtotal * 0.1 : 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => setIsCheckingOut(true)}
                  className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all mb-4"
                >
                  Proceed to Checkout
                </button>

                {/* Secure Checkout Badges */}
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <FiShield className="h-4 w-4 mr-1" />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center">
                      <FiTruck className="h-4 w-4 mr-1" />
                      <span>Free shipping over Rs999</span>
                    </div>
                    <div className="flex items-center">
                      <FiRefreshCw className="h-4 w-4 mr-1" />
                      <span>30-day returns</span>
                    </div>
                  </div>
                  
                  {/* Payment Methods */}
                  <div className="flex justify-center space-x-2 pt-4">
                    <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                      Visa
                    </div>
                    <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                      Mastercard
                    </div>
                    <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                      UPI
                    </div>
                    <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                      Razorpay
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;