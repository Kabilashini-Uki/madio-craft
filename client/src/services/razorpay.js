const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const displayRazorpay = async (orderData, onSuccess, onError) => {
  const res = await loadRazorpay();

  if (!res) {
    onError('Razorpay SDK failed to load');
    return;
  }

  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY_ID,
    amount: orderData.amount,
    currency: orderData.currency,
    name: 'MadioCraft',
    description: 'Order Payment',
    order_id: orderData.id,
    handler: async function (response) {
      try {
        const verifyResponse = await fetch(`${process.env.REACT_APP_API_URL}/orders/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        const verifyData = await verifyResponse.json();

        if (verifyData.success) {
          onSuccess(verifyData.order);
        } else {
          onError('Payment verification failed');
        }
      } catch (err) {
        onError('Payment verification failed');
      }
    },
    prefill: {
      name: orderData.name || '',
      email: orderData.email || '',
      contact: orderData.phone || '',
    },
    notes: {
      address: orderData.address || '',
    },
    theme: {
      color: '#8B4513',
    },
  };

  const paymentObject = new window.Razorpay(options);
  paymentObject.open();
};