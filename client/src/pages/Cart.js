import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTrash, FaPlus, FaMinus, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Cart = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Handmade Ceramic Mug',
      artisan: 'Pottery Studio',
      price: 1200,
      quantity: 2,
      image: 'https://via.placeholder.com/150',
      customizable: true
    },
    {
      id: 2,
      name: 'Wooden Carved Bowl',
      artisan: 'Woodcraft Artisans',
      price: 2500,
      quantity: 1,
      image: 'https://via.placeholder.com/150',
      customizable: false
    },
    {
      id: 3,
      name: 'Silver Pendant Necklace',
      artisan: 'Silver Smith',
      price: 3500,
      quantity: 1,
      image: 'https://via.placeholder.com/150',
      customizable: true
    }
  ]);

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
  const shipping = 150;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif font-bold text-primary-dark">Shopping Cart</h1>
          <Link to="/products" className="flex items-center space-x-2 text-primary hover:text-primary-dark">
            <FaArrowLeft className="h-4 w-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some beautiful handmade products to get started!</p>
            <Link to="/products" className="btn-primary inline-block">
              Browse Products
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Product Image */}
                    <div className="w-full sm:w-32 h-32 rounded-lg overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-primary-dark mb-2">{item.name}</h3>
                          <p className="text-gray-600 mb-1">By {item.artisan}</p>
                          {item.customizable && (
                            <span className="inline-block bg-primary/10 text-primary text-sm px-3 py-1 rounded-full mb-3">
                              ✨ Customizable
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <FaTrash className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center border-2 border-primary/20 rounded-full">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-10 h-10 flex items-center justify-center hover:bg-primary/10 rounded-l-full"
                            >
                              <FaMinus className="h-4 w-4" />
                            </button>
                            <span className="w-12 text-center font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-10 h-10 flex items-center justify-center hover:bg-primary/10 rounded-r-full"
                            >
                              <FaPlus className="h-4 w-4" />
                            </button>
                          </div>
                          {item.customizable && (
                            <button className="text-primary hover:text-primary-dark font-semibold">
                              Edit Customization
                            </button>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">₹{item.price * item.quantity}</p>
                          <p className="text-sm text-gray-600">₹{item.price} each</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 sticky top-8"
              >
                <h2 className="text-2xl font-bold text-primary-dark mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold">₹{shipping}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (18%)</span>
                    <span className="font-semibold">₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary-dark">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Link to="/checkout" className="block w-full btn-primary text-center py-4">
                  Proceed to Checkout
                </Link>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center text-green-600">
                    <span className="mr-2">✓</span>
                    <span className="text-sm">Secure checkout with Razorpay</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <span className="mr-2">✓</span>
                    <span className="text-sm">Free shipping on orders over ₹999</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <span className="mr-2">✓</span>
                    <span className="text-sm">30-day return policy</span>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="font-semibold mb-3">Need help?</h3>
                  <p className="text-sm text-gray-600">
                    Contact our support team at <span className="text-primary">support@madiocraft.com</span>
                  </p>
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