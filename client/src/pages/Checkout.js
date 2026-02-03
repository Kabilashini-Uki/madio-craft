import React, { useState } from 'react';
import { FaCreditCard, FaTruck, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Checkout = () => {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const steps = [
    { number: 1, title: 'Shipping', icon: <FaTruck /> },
    { number: 2, title: 'Payment', icon: <FaCreditCard /> },
    { number: 3, title: 'Confirm', icon: <FaCheckCircle /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex justify-between items-center">
            {steps.map((s, index) => (
              <React.Fragment key={s.number}>
                <div className="text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 transition-all
                    ${step >= s.number ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {s.icon}
                  </div>
                  <span className={`text-sm font-medium ${step >= s.number ? 'text-primary' : 'text-gray-400'}`}>
                    {s.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-grow mx-4 ${step > s.number ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-primary-dark mb-6">Shipping Address</h2>
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="First Name" className="input-field" />
                      <input type="text" placeholder="Last Name" className="input-field" />
                    </div>
                    <input type="text" placeholder="Address" className="input-field" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="City" className="input-field" />
                      <input type="text" placeholder="State" className="input-field" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="ZIP Code" className="input-field" />
                      <input type="tel" placeholder="Phone Number" className="input-field" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="btn-primary w-full"
                    >
                      Continue to Payment
                    </button>
                  </form>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-primary-dark mb-6">Payment Method</h2>
                  <div className="space-y-4 mb-6">
                    <label className="flex items-center p-4 border-2 border-primary rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="mr-3"
                      />
                      <FaCreditCard className="h-6 w-6 text-primary mr-3" />
                      <div>
                        <p className="font-semibold">Credit/Debit Card</p>
                        <p className="text-sm text-gray-600">Pay securely with your card</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                        className="mr-3"
                      />
                      <div className="w-12 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                        <span className="font-bold text-blue-600">R</span>
                      </div>
                      <div>
                        <p className="font-semibold">Razorpay</p>
                        <p className="text-sm text-gray-600">Secure payment gateway</p>
                      </div>
                    </label>
                  </div>

                  {paymentMethod === 'card' && (
                    <form className="space-y-4">
                      <input type="text" placeholder="Card Number" className="input-field" />
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="MM/YY" className="input-field" />
                        <input type="text" placeholder="CVV" className="input-field" />
                      </div>
                      <input type="text" placeholder="Cardholder Name" className="input-field" />
                    </form>
                  )}

                  <button
                    onClick={() => setStep(3)}
                    className="btn-primary w-full mt-6"
                  >
                    Continue to Confirmation
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaCheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-primary-dark mb-4">Order Confirmed!</h2>
                  <p className="text-gray-600 mb-6">
                    Thank you for your order. Your order number is <span className="font-bold">#ORD789012</span>
                  </p>
                  <div className="space-y-2 mb-8">
                    <p>We've sent a confirmation email to your registered email address.</p>
                    <p>You can track your order in your dashboard.</p>
                  </div>
                  <div className="flex gap-4">
                    <button className="btn-primary flex-1">View Order Details</button>
                    <button className="btn-secondary flex-1">Continue Shopping</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Order Summary */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 sticky top-8"
            >
              <h3 className="text-xl font-bold text-primary-dark mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src="https://via.placeholder.com/60"
                      alt="Product"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium">Ceramic Mug</p>
                      <p className="text-sm text-gray-600">Qty: 2</p>
                    </div>
                  </div>
                  <span className="font-bold">₹2,400</span>
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹6,700</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>₹150</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>₹1,206</span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary-dark">₹8,056</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-green-600">
                  <span className="mr-2">✓</span>
                  <span className="text-sm">Secure payment</span>
                </div>
                <div className="flex items-center text-green-600">
                  <span className="mr-2">✓</span>
                  <span className="text-sm">Order protection</span>
                </div>
                <div className="flex items-center text-green-600">
                  <span className="mr-2">✓</span>
                  <span className="text-sm">Easy returns</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;