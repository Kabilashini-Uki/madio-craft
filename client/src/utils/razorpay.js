// src/utils/razorpay.js
import api from '../services/api';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const displayRazorpay = async (orderData, onSuccess, onError, userInfo = {}) => {
  const res = await loadRazorpay();
  if (!res) {
    onError('Razorpay SDK failed to load. Check your internet connection.');
    return;
  }

  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY_ID || '',
    amount: orderData.amount,
    currency: orderData.currency || 'INR',
    name: 'MadioCraft',
    description: 'Artisan Marketplace - Handcrafted with Love',
    image: '/logo192.png',
    order_id: orderData.id,
    handler: async function (response) {
      try {
        const res = await api.post('/orders/verify-payment', {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });

        if (res.data.success) {
          onSuccess(res.data.order);
        } else {
          onError(res.data.message || 'Payment verification failed');
        }
      } catch (err) {
        console.error('Razorpay verification error:', err);
        onError('Payment verification failed');
      }
    },
    prefill: {
      name: userInfo.name || '',
      email: userInfo.email || '',
      contact: userInfo.phone || '',
    },
    theme: { color: '#8B4513' },
    modal: {
      ondismiss: function () {
        onError('Payment was cancelled.');
      }
    }
  };

  try {
    const paymentObject = new window.Razorpay(options);
    paymentObject.on('payment.failed', (response) => {
      onError(response.error.description || 'Payment failed');
    });
    paymentObject.open();
  } catch (e) {
    onError('Failed to initialize payment. Please try again.');
  }
};
