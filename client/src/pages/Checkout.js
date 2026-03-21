// pages/SimpleCheckout.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiMapPin, FiCheckCircle, FiArrowLeft,
  FiTruck, FiShield, FiPackage, FiLock,
  FiUser, FiPhone, FiMail, FiHome
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import toast from 'react-hot-toast';

// Delivery locations
const DELIVERY_LOCATIONS = [
  'Eravur', 'Marudhamunai', 'Valaichenai', 'Ottamavadi', 'Kaatankudy'
];

const SimpleCheckout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartSummary, clearCart } = useCart();

  // Block artisans and admins from placing orders — unless they're in buyer mode
  useEffect(() => {
    const effectiveRole = user?.activeRole || user?.role;
    if (user && (user.role === 'artisan' || user.role === 'admin') && effectiveRole !== 'buyer') {
      toast.error('Switch to buyer mode to place orders.');
      navigate('/');
    }
  }, [user]);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [checkoutSummary, setCheckoutSummary] = useState({ subtotal: 0, shipping: 0, total: 0 });
  const [isBuyNow, setIsBuyNow] = useState(false);

  // Load checkout items (either from cart or a specific product for "Buy Now")
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const buyNowProductId = params.get('productId');

    const initializeCheckout = async () => {
      if (buyNowProductId) {
        try {
          setLoading(true);
          const res = await api.get(`/products/${buyNowProductId}`);
          const product = res.data.product || res.data;

          const buyNowItem = {
            product: product,
            quantity: 1,
            price: product.price,
            totalPrice: product.price
          };

          setCheckoutItems([buyNowItem]);
          const subtotal = product.price;
          const shipping = subtotal > 999 ? 0 : 99;
          setCheckoutSummary({ subtotal, shipping, total: subtotal + shipping });
          setIsBuyNow(true);
        } catch (err) {
          console.error('Failed to load buy now product:', err);
          toast.error('Failed to load product for checkout');
          navigate('/cart');
        } finally {
          setLoading(false);
        }
      } else {
        if (cartItems.length > 0) {
          setCheckoutItems(cartItems);
          setCheckoutSummary({
            subtotal: cartSummary.subtotal,
            shipping: cartSummary.shipping,
            total: cartSummary.total
          });
          setIsBuyNow(false);
        } else if (!orderPlaced) {
          navigate('/cart');
        }
      }
    };

    initializeCheckout();
  }, [cartItems, cartSummary, navigate, orderPlaced]);

  // Shipping address form
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    address: '',
    city: '',
    district: 'Batticaloa',
    phone: user?.phone || '',
    email: user?.email || ''
  });


  const handleInputChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    });
  };

  const validateAddress = () => {
    const { name, address, city, district, phone } = shippingAddress;

    if (!name || !address || !city || !district || !phone) {
      toast.error('Please fill in all required fields');
      return false;
    }

    // Sri Lankan phone validation (starts with 07 and has 9 digits)
    const phoneRegex = /^07[0-9]{8}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      toast.error('Please enter a valid Sri Lankan phone number (07XXXXXXXX)');
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) return;

    setLoading(true);

    try {
      // Prepare order data
      const orderData = {
        items: checkoutItems.map(item => {
          const productId = item.product?._id || item.product;
          const unitPrice = item.price || item.product?.price || 0;
          return {
            product: productId,
            quantity: item.quantity,
            customization: item.customization || null,
            price: unitPrice,
          };
        }),
        shippingAddress,
        paymentMethod: 'cod',
        subtotal: checkoutSummary.subtotal,
        shippingCost: checkoutSummary.shipping,
        tax: 0,
        totalAmount: checkoutSummary.total,
      };

      console.log('Placing order:', orderData);

      const response = await api.post('/orders', orderData);

      if (response.data.success) {
        setOrderId(response.data.order.orderId || response.data.order._id);
        setOrderPlaced(true);
        clearCart();
        toast.success('Order placed successfully!');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error?.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  // Order confirmation screen
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheckCircle className="h-10 w-10 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Order Confirmed! 🎉
            </h1>

            <p className="text-gray-600 mb-6">
              Thank you for your order. Your artisan has been notified.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Order ID</p>
              <p className="text-lg font-mono font-bold text-primary">{orderId}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-left">
              <div className="flex items-start space-x-3">
                <FiTruck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Payment Method: Cash on Delivery</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Pay Rs. {Math.round(checkoutSummary.total).toLocaleString()} when you receive your order.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark"
              >
                View My Orders
              </button>
              <button
                onClick={() => navigate('/products')}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
              >
                Continue Shopping
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-6"
        >
          <FiArrowLeft className="h-5 w-5" />
          <span>Back to Cart</span>
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-600 mb-8">Complete your order with Cash on Delivery</p>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>1</div>
            <span className="mx-3 text-sm font-medium">Shipping</span>
          </div>
          <div className={`w-16 h-1 mx-2 ${step > 1 ? 'bg-primary' : 'bg-gray-200'}`}></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>2</div>
            <span className="mx-3 text-sm font-medium">Confirm</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <FiMapPin className="mr-2 text-primary" />
                Shipping Address
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={shippingAddress.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={shippingAddress.address}
                    onChange={handleInputChange}
                    placeholder="House No, Street, Area"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Village or Place Name *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District *
                    </label>
                    <select
                      name="district"
                      value={shippingAddress.district}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-600 outline-none cursor-not-allowed"
                      disabled
                    >
                      <option value="Batticaloa">Batticaloa</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={shippingAddress.phone}
                      onChange={handleInputChange}
                      placeholder="07XXXXXXXX"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (for updates)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={shippingAddress.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark"
                >
                  Continue to Confirm
                </button>
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h3>

              <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                {checkoutItems.map((item, i) => (
                  <div key={i} className="flex items-start space-x-3 pb-4 border-b last:border-0">
                    <img
                      src={item.product?.images?.[0]?.url || item.product?.images?.[0] || 'https://via.placeholder.com/60'}
                      alt={item.product?.name}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{item.product?.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">Rs. {Math.round(checkoutSummary.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {checkoutSummary.shipping === 0 ? 'Free' : `Rs. ${checkoutSummary.shipping}`}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">Rs. {Math.round(checkoutSummary.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-green-50 rounded-xl">
                <div className="flex items-center space-x-2">
                  <FiTruck className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Cash on Delivery</p>
                    <p className="text-xs text-green-600">Pay when you receive</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Step Modal */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setStep(1)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-md p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Your Order</h3>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="font-medium text-gray-900 mb-2">Shipping to:</p>
                <p className="text-sm text-gray-600">{shippingAddress.name}</p>
                <p className="text-sm text-gray-600">{shippingAddress.address}</p>
                <p className="text-sm text-gray-600">{shippingAddress.city}, {shippingAddress.district}</p>
                <p className="text-sm text-gray-600">📞 {shippingAddress.phone}</p>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-600">Total Amount:</span>
                <span className="text-2xl font-bold text-primary">Rs. {Math.round(checkoutSummary.total).toLocaleString()}</span>
              </div>

              <div className="bg-blue-50 rounded-xl p-3 mb-6">
                <p className="text-sm text-blue-800 flex items-center">
                  <FiLock className="mr-2 h-4 w-4" />
                  You'll pay when you receive your order
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700"
                >
                  Edit
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50"
                >
                  {loading ? 'Placing...' : 'Confirm Order'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SimpleCheckout;