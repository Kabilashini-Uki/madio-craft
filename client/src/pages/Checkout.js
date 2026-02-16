// pages/Checkout.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaCreditCard, 
  FaTruck, 
  FaCheckCircle,
  FaRupeeSign,
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaHome,
  FaCity,
  FaGlobe
} from 'react-icons/fa';
import { FiShoppingBag, FiArrowLeft, FiLock, FiShield } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { displayRazorpay } from '../utils/razorpay';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, calculateTotal, clearCart } = useCart();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [orderDetails, setOrderDetails] = useState(null);
  
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phone: user?.phone || ''
  });

  const [errors, setErrors] = useState({});

  // Calculate totals
  const subtotal = calculateTotal();
  const shipping = subtotal > 999 ? 0 : 99;
  const tax = subtotal * 0.18; // 18% GST
  const total = subtotal + shipping + tax;

  const steps = [
    { number: 1, title: 'Shipping', icon: <FaTruck /> },
    { number: 2, title: 'Payment', icon: <FaCreditCard /> },
    { number: 3, title: 'Confirm', icon: <FaCheckCircle /> },
  ];

  const validateShipping = () => {
    const newErrors = {};
    if (!shippingAddress.name) newErrors.name = 'Name is required';
    if (!shippingAddress.address) newErrors.address = 'Address is required';
    if (!shippingAddress.city) newErrors.city = 'City is required';
    if (!shippingAddress.state) newErrors.state = 'State is required';
    if (!shippingAddress.zipCode) newErrors.zipCode = 'ZIP code is required';
    if (!shippingAddress.phone) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(shippingAddress.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (validateShipping()) {
      setStep(2);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Create order on backend
      const orderData = {
        items: cartItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          customization: item.customization || null,
          price: item.price
        })),
        shippingAddress,
        totalAmount: total,
        finalAmount: total
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/orders`,
        orderData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setOrderDetails(response.data.order);
        
        // Initialize Razorpay payment
        if (paymentMethod === 'razorpay') {
          const razorpayOrder = response.data.razorpayOrder;
          
          const options = {
            key: process.env.REACT_APP_RAZORPAY_KEY_ID,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: 'MadioCraft',
            description: `Order #${response.data.order.orderId}`,
            order_id: razorpayOrder.id,
            handler: async function(response) {
              try {
                // Verify payment
                const verifyRes = await axios.post(
                  `${process.env.REACT_APP_API_URL}/orders/verify-payment`,
                  {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                  }
                );

                if (verifyRes.data.success) {
                  toast.success('Payment successful!');
                  clearCart();
                  setStep(3);
                }
              } catch (error) {
                toast.error('Payment verification failed');
              }
            },
            prefill: {
              name: shippingAddress.name,
              email: user?.email,
              contact: shippingAddress.phone
            },
            theme: {
              color: '#8B4513'
            }
          };

          const razorpay = new window.Razorpay(options);
          razorpay.open();
        } else {
          // Mock payment for testing
          toast.success('Order placed successfully!');
          clearCart();
          setStep(3);
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Failed to process order');
    } finally {
      setLoading(false);
    }
  };

  const handleViewShop = (artisanId) => {
    navigate(`/artisans/${artisanId}`);
  };

  if (cartItems.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
            <FiShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some items to your cart before checking out</p>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => step === 1 ? navigate('/cart') : setStep(step - 1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-8"
        >
          <FiArrowLeft className="h-5 w-5" />
          <span>{step === 1 ? 'Back to Cart' : 'Back to Shipping'}</span>
        </button>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex justify-between items-center">
            {steps.map((s, index) => (
              <React.Fragment key={s.number}>
                <div className="text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 transition-all
                    ${step >= s.number 
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-400'
                    }`}>
                    {s.icon}
                  </div>
                  <span className={`text-sm font-medium ${step >= s.number ? 'text-primary' : 'text-gray-400'}`}>
                    {s.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-grow mx-4 rounded-full ${
                    step > s.number ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-primary-dark mb-6 flex items-center">
                    <FaTruck className="mr-3 text-primary" />
                    Shipping Address
                  </h2>
                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={shippingAddress.name}
                            onChange={(e) => setShippingAddress({...shippingAddress, name: e.target.value})}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary ${
                              errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="John Doe"
                          />
                        </div>
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <div className="relative">
                          <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            value={shippingAddress.phone}
                            onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary ${
                              errors.phone ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="9876543210"
                          />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <div className="relative">
                        <FaHome className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={shippingAddress.address}
                          onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary ${
                            errors.address ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="123 Main St"
                        />
                      </div>
                      {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <div className="relative">
                          <FaCity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={shippingAddress.city}
                            onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary ${
                              errors.city ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Mumbai"
                          />
                        </div>
                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <div className="relative">
                          <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={shippingAddress.state}
                            onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary ${
                              errors.state ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Maharashtra"
                          />
                        </div>
                        {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.zipCode}
                          onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary ${
                            errors.zipCode ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="400001"
                        />
                        {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <div className="relative">
                          <FaGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={shippingAddress.country}
                            onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary"
                            placeholder="India"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                    >
                      Continue to Payment
                    </button>
                  </form>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-primary-dark mb-6 flex items-center">
                    <FaCreditCard className="mr-3 text-primary" />
                    Payment Method
                  </h2>
                  
                  <div className="space-y-4 mb-6">
                    <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'razorpay' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-primary/30'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                        className="mr-3"
                      />
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                        <span className="font-bold text-blue-600">R</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Razorpay</p>
                        <p className="text-sm text-gray-600">Pay via UPI, Card, NetBanking, Wallet</p>
                      </div>
                      <FiShield className="h-5 w-5 text-green-500" />
                    </label>
                    
                    <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'cod' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-primary/30'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="mr-3"
                      />
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                        <FaTruck className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Cash on Delivery</p>
                        <p className="text-sm text-gray-600">Pay when you receive your order</p>
                      </div>
                    </label>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items:</span>
                        <span className="font-medium">Rs{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping:</span>
                        <span className="font-medium">{shipping === 0 ? 'Free' : `Rs${shipping}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax (18% GST):</span>
                        <span className="font-medium">Rs{Math.round(tax).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span className="text-primary">Rs{Math.round(total).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <FiLock className="h-5 w-5" />
                        <span>Pay Rs{Math.round(total).toLocaleString()}</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    Your payment is secure. All transactions are encrypted.
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaCheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-primary-dark mb-4">Order Confirmed!</h2>
                  <p className="text-gray-600 mb-6">
                    Thank you for your order. Your order number is{' '}
                    <span className="font-bold text-primary">#{orderDetails?.orderId}</span>
                  </p>
                  <div className="space-y-2 mb-8">
                    <p>A confirmation email has been sent to {user?.email}</p>
                    <p>You can track your order status in your dashboard.</p>
                  </div>
                  
                  {/* View Shop Buttons */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Shop More From These Artisans</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {cartItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleViewShop(item.product.artisan?._id)}
                          className="p-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center space-x-3"
                        >
                          <img
                            src={item.product.artisan?.avatar?.url || 'https://via.placeholder.com/50'}
                            alt={item.product.artisan?.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{item.product.artisan?.name}</p>
                            <p className="text-sm text-gray-500">View Shop →</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="flex-1 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark"
                    >
                      View Order Details
                    </button>
                    <button
                      onClick={() => navigate('/products')}
                      className="flex-1 px-6 py-3 border-2 border-primary text-primary rounded-xl hover:bg-primary/5"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Order Summary Sidebar */}
          {step !== 3 && (
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 sticky top-24"
              >
                <h3 className="text-xl font-bold text-primary-dark mb-6">Order Summary</h3>
                
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                      <img
                        src={item.product.images?.[0]?.url || 'https://via.placeholder.com/60'}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{item.product.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        {item.customization && (
                          <span className="text-xs text-primary">Customized</span>
                        )}
                      </div>
                      <span className="font-bold text-gray-900">Rs{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">Rs{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">{shipping === 0 ? 'Free' : `Rs${shipping}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (18% GST)</span>
                    <span className="font-medium">Rs{Math.round(tax).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary-dark">Rs{Math.round(total).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center text-green-600 text-sm">
                    <FiLock className="mr-2 h-4 w-4" />
                    <span>Secure payment</span>
                  </div>
                  <div className="flex items-center text-green-600 text-sm">
                    <FaTruck className="mr-2 h-4 w-4" />
                    <span>Free shipping on orders over Rs999</span>
                  </div>
                  <div className="flex items-center text-green-600 text-sm">
                    <FaCheckCircle className="mr-2 h-4 w-4" />
                    <span>30-day easy returns</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;