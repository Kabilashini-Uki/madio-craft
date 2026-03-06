// pages/SimpleCart.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiTrash2, FiPlus, FiMinus, FiShoppingBag,
  FiArrowLeft, FiTruck, FiShield
} from 'react-icons/fi';
import { useCart } from '../context/CartContext';

const SimpleCart = () => {
  const navigate = useNavigate();
  const { cartItems, cartSummary, updateQuantity, removeFromCart } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center py-16"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiShoppingBag className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link
              to="/products"
              className="inline-block px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark"
            >
              Start Shopping
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-4"
          >
            <FiArrowLeft className="h-5 w-5" />
            <span>Continue Shopping</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600">{cartSummary.itemCount} items</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <motion.div
                key={item.id || item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm p-4"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <img
                    src={item.product.images?.[0]?.url || 'https://via.placeholder.com/100'}
                    alt={item.product.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                        <p className="text-sm text-gray-500">
                          by {item.product.artisan?.name || 'Artisan'}
                        </p>
                        {item.customization && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                            Customized
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id || item._id)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id || item._id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50"
                        >
                          <FiMinus className="h-3 w-3" />
                        </button>
                        <span className="w-10 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id || item._id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50"
                        >
                          <FiPlus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="font-bold text-gray-900">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">Rs. {Math.round(cartSummary.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {cartSummary.shipping === 0 ? 'Free' : `Rs. ${cartSummary.shipping}`}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">Rs. {Math.round(cartSummary.subtotal + cartSummary.shipping).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {cartSummary.shipping > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  Add Rs. {(1000 - cartSummary.subtotal).toLocaleString()} more for free shipping!
                </div>
              )}

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark mb-3"
              >
                Proceed to Checkout
              </button>

              <div className="flex justify-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <FiShield className="h-3 w-3 mr-1" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center">
                  <FiTruck className="h-3 w-3 mr-1" />
                  <span>Free ship Rs. 1000+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleCart;