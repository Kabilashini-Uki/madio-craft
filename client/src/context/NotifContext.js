// context/NotifContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from './SocketContext';
import api from '../services/api';

const NotifContext = createContext();
export const useNotif = () => useContext(NotifContext);

/* ── Artisan popup with inline Accept / Reject for Customization ── */
const CustomizationRequestToast = ({ t, data, onRespond }) => {
  const [responding, setResponding] = React.useState(null);

  const handle = async (available) => {
    setResponding(available ? 'accept' : 'reject');
    try {
      await onRespond(data, available);
      toast.dismiss(t.id);
    } catch {
      setResponding(null);
    }
  };

  const time = new Date(data.timestamp || Date.now())
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      transform: t.visible ? 'translateX(0)' : 'translateX(110%)',
      transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      opacity: t.visible ? 1 : 0,
      minWidth: 320, maxWidth: 360,
    }} className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-purple-100 w-full">
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'linear-gradient(90deg,#7c3aed,#9333ea)' }}>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl flex-shrink-0">🎨</div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">Customisation Request!</p>
          <p className="text-violet-200 text-[10px]">{time}</p>
        </div>
        <button onClick={() => toast.dismiss(t.id)} className="text-white/60 hover:text-white text-lg leading-none flex-shrink-0">×</button>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {data.sender?.avatar
            ? <img src={data.sender.avatar} alt={data.sender.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            : <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                <span className="text-violet-700 font-bold text-sm">{(data.sender?.name || 'B')[0].toUpperCase()}</span>
              </div>
          }
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{data.sender?.name || 'A buyer'}</p>
            <p className="text-xs text-gray-500">sent a customisation request</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-3 bg-violet-50 rounded-xl p-2">
          {data.product?.image && (
            <img src={data.product.image} alt={data.product?.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Product</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{data.product?.name || 'Unknown product'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {data.color && <span className="px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-[11px] font-semibold border border-violet-100">🎨 {data.color}</span>}
          {data.size && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-semibold border border-blue-100">📐 {data.size}</span>}
          {data.notes && <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] border border-amber-100 max-w-full">📝 {data.notes.slice(0, 50)}{data.notes.length > 50 ? '…' : ''}</span>}
          {!data.color && !data.size && !data.notes && (
            <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded-full text-[11px] border border-gray-100">📋 {data.message || 'See dashboard for details'}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => handle(true)} disabled={responding !== null}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${responding === 'accept' ? 'bg-green-400 text-white cursor-wait' : 'bg-green-500 hover:bg-green-600 text-white active:scale-95'} disabled:opacity-60`}>
            {responding === 'accept' ? '✓ Accepting…' : '✓ Accept'}
          </button>
          <button onClick={() => handle(false)} disabled={responding !== null}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${responding === 'reject' ? 'bg-red-400 text-white cursor-wait' : 'bg-red-100 hover:bg-red-200 text-red-700 active:scale-95'} disabled:opacity-60`}>
            {responding === 'reject' ? 'Declining…' : '✕ Decline'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Delivery Review Popup with Rating System (No Shipping) ── */
const DeliveryReviewPopup = ({ data, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [step, setStep] = useState('confirm'); // 'confirm' | 'review' | 'done'
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      // Just move to review step - actual API call happens when submitting review
      setStep('review');
    } catch (err) {
      console.error('Confirmation error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!rating) {
      toast.error('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      if (data.orderDbId) {
        await api.post(`/orders/${data.orderDbId}/confirm-received`, {
          received: true,
          rating,
          comment: comment.trim()
        });
      }
      setStep('done');
      toast.success('Thank you for your feedback!');
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error('Review submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" 
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header with gradient based on step */}
        <div className={`px-6 py-5 text-center ${
          step === 'confirm' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 
          step === 'review' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
          'bg-gradient-to-r from-purple-500 to-indigo-600'
        }`}>
          <div className="text-4xl mb-2">
            {step === 'done' ? '🎉' : step === 'review' ? '⭐' : '📦'}
          </div>
          <h2 className="text-white font-bold text-lg">
            {step === 'confirm' ? 'Order Delivered!' : step === 'review' ? 'Rate Your Experience' : 'Thank You!'}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {step === 'confirm' ? `Order #${data.orderId}` : 
             step === 'review' ? 'Share your feedback' : 
             'Your review helps others'}
          </p>
        </div>

        <div className="p-6">
          {step === 'confirm' && (
            <div className="text-center">
              {data.productImage && (
                <img src={data.productImage} alt="" className="w-20 h-20 rounded-xl object-cover mx-auto mb-4 shadow" />
              )}
              <p className="text-gray-700 text-sm mb-1">
                <span className="font-semibold">{data.productName || 'Your order'}</span> has been delivered!
              </p>
              {data.artisanName && (
                <p className="text-xs text-gray-400 mb-4">by {data.artisanName}</p>
              )}
              <div className="space-y-2">
                <button onClick={handleConfirm} disabled={submitting}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60">
                  {submitting ? 'Confirming...' : '✓ Confirm Received'}
                </button>
                <button onClick={() => setStep('review')}
                  className="w-full py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50">
                  Rate & Review →
                </button>
                <button onClick={onClose} className="w-full py-2 text-gray-400 text-sm hover:text-gray-600">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div>
              {/* Star Rating */}
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star} 
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)} 
                    onMouseLeave={() => setHover(0)}
                    className="text-3xl transition-transform active:scale-90"
                  >
                    <span className={(hover || rating) >= star ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm font-medium text-amber-600 mb-3">
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                </p>
              )}
              
              {/* Review Comment */}
              <textarea 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                rows={3}
                placeholder="Tell us about your experience (optional)…"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-amber-400 outline-none resize-none mb-4" 
              />
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button onClick={() => setStep('confirm')}
                  className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50">
                  ← Back
                </button>
                <button 
                  onClick={handleSubmitReview} 
                  disabled={submitting || !rating}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit ★'}
                </button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-gray-700 font-medium">Thank you for your review!</p>
              <p className="text-gray-400 text-sm mt-1">Your feedback helps the artisan grow.</p>
              <button 
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── NotifProvider Component ── */
export const NotifProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDeliveryReview, setShowDeliveryReview] = useState(false);
  const [deliveryReviewData, setDeliveryReviewData] = useState(null);
  const [approvedCustomizations, setApprovedCustomizations] = useState({});
  const { socket } = useSocket();

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      if (data.success) {
        setNotifications(data.notifications.map(n => ({
          ...n.data,
          id: n._id,
          read: n.read,
          type: n.type,
          title: n.title,
          body: n.body,
          timestamp: n.createdAt
        })));
      }
    } catch (e) {
      console.warn('Failed to fetch notifications', e);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const addNotification = useCallback((notif) => {
    setNotifications(prev =>
      [{ ...notif, id: Date.now() + Math.random(), read: false, timestamp: new Date() }, ...prev].slice(0, 50)
    );
  }, []);

  const markRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try { await api.put(`/notifications/${id}/read`); } catch (e) { }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await api.put('/notifications/read-all'); } catch (e) { }
  }, []);

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    try { await api.delete('/notifications'); } catch (e) { }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const updateNotifStatus = useCallback((requestId, status) => {
    setNotifications(prev => prev.map(n =>
      n.requestId === String(requestId) ? { ...n, status, read: false } : n
    ));
  }, []);

  // Artisan responds to customization request
  const respondToRequest = useCallback(async (data, available) => {
    let price = 0;
    if (available) {
      const input = window.prompt(`Set a price for this customization for "${data.product?.name || 'this product'}":`, "0");
      if (input === null) return;
      price = Number(input) || 0;
    }

    if (data.isChatRequest) {
      await api.post('/chat/request-response', {
        buyerId: data.sender?.id,
        available,
        roomId: data.roomId || data.requestId,
        customizationPrice: price
      });
    } else {
      await api.post(`/products/${data.product?.id}/customization-response`, {
        available,
        buyerId: data.sender?.id,
        requestId: data.requestId,
        customizationPrice: price
      });
    }
    updateNotifStatus(data.requestId, available ? 'accepted' : 'rejected');
    toast.success(available ? '✓ Request accepted — buyer notified!' : 'Request declined.');
  }, [updateNotifStatus]);

  const isCustomizationApproved = useCallback((productId) => {
    return !!approvedCustomizations[String(productId)];
  }, [approvedCustomizations]);

  const getCustomizationData = useCallback((productId) => {
    return approvedCustomizations[String(productId)] || null;
  }, [approvedCustomizations]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // New Order Notification
    const handleNewOrder = (data) => {
      addNotification({
        type: 'new-order',
        title: 'New Order Received!',
        body: `Order #${data.orderId} from ${data.buyerName || 'a buyer'} — LKR ${Number(data.amount || 0).toLocaleString()}`,
        icon: '🛒',
        orderId: data.orderId,
        orderDbId: data.orderDbId,
      });
      toast.custom((t) => (
        <div 
          className={`bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full cursor-pointer ${t.visible ? 'opacity-100' : 'opacity-0'}`} 
          onClick={() => { toast.dismiss(t.id); window.location.href = '/artisan-dashboard'; }}
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl flex-shrink-0">🛒</div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">New Order Received!</p>
              <p className="text-green-100 text-[10px]">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <button onClick={e => { e.stopPropagation(); toast.dismiss(t.id); }} className="text-white/60 hover:text-white text-lg">×</button>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {data.buyerAvatar
                ? <img src={data.buyerAvatar} alt={data.buyerName} className="w-8 h-8 rounded-full object-cover" />
                : <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">{(data.buyerName || 'B')[0].toUpperCase()}</span>
              }
              <span className="text-sm font-semibold text-gray-900">{data.buyerName || 'A buyer'}</span>
            </div>
            <p className="text-xs text-gray-500">Product: <span className="font-medium text-gray-700">{data.productName || 'your product'}</span></p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-lg font-bold text-green-700">LKR {Number(data.amount || 0).toLocaleString()}</span>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-semibold">Order #{data.orderId}</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Tap to open your dashboard →</p>
          </div>
        </div>
      ), { duration: 10000, position: 'top-right' });
    };

    // Order Status Update (for buyers)
    const handleStatusUpdate = (data) => {
      const isDelivered = data.isDelivered || data.status === 'delivered';
      addNotification({
        type: 'order-status',
        title: isDelivered ? '🎉 Order Delivered!' : 'Order Status Updated',
        body: isDelivered
          ? `Your order #${data.orderId} has been delivered! Please confirm and leave a review.`
          : `Order #${data.orderId} is now "${data.status}"`,
        icon: isDelivered ? '🎉' : '📦',
        orderId: data.orderId,
        orderDbId: data.orderDbId,
        status: data.status,
      });

      // Show delivery review popup when order is delivered
      if (isDelivered) {
        setDeliveryReviewData(data);
        setShowDeliveryReview(true);
      }

      toast.custom((t) => (
        <div 
          className={`bg-white border-l-4 ${isDelivered ? 'border-green-500' : 'border-blue-500'} rounded-xl shadow-xl p-4 max-w-sm w-full cursor-pointer ${t.visible ? 'opacity-100' : 'opacity-0'}`} 
          onClick={() => toast.dismiss(t.id)}
        >
          <p className="font-bold text-gray-900 text-sm">{isDelivered ? '🎉 Order Delivered!' : '📦 Order Status Updated'}</p>
          <p className="text-xs text-gray-600 mt-1">
            Order <span className="font-semibold">#{data.orderId}</span> is now <span className={`font-semibold capitalize ${isDelivered ? 'text-green-700' : 'text-blue-700'}`}>{data.status}</span>
          </p>
          {data.status === 'order ready' && <p className="text-xs text-indigo-600 mt-1 font-medium">⚠️ You can no longer cancel this order.</p>}
          {isDelivered && <p className="text-xs text-green-600 mt-1 font-semibold">✓ Please confirm receipt and leave a review!</p>}
        </div>
      ), { duration: isDelivered ? 15000 : 5000, position: 'top-right' });
    };

    // Order Cancelled Notification
    const handleOrderCancelled = (data) => {
      addNotification({
        type: 'order-cancelled',
        title: 'Order Cancelled',
        body: data.message || `Order #${data.orderId} was cancelled by the buyer`,
        icon: '❌',
      });
      toast.custom((t) => (
        <div className={`bg-white border-l-4 border-red-500 rounded-xl shadow-xl p-4 max-w-sm w-full cursor-pointer ${t.visible ? 'opacity-100' : 'opacity-0'}`} onClick={() => toast.dismiss(t.id)}>
          <p className="font-bold text-gray-900 text-sm">❌ Order Cancelled</p>
          <p className="text-xs text-gray-600 mt-1">{data.message || `Order #${data.orderId} was cancelled`}</p>
        </div>
      ), { duration: 6000, position: 'top-right' });
    };

    // Customization Request (for artisans)
    const handleCustomizationRequest = (data) => {
      addNotification({
        type: 'customization-request',
        title: 'Customisation Request',
        sender: data.sender,
        product: data.product,
        message: data.message || `${data.sender?.name} wants to customise ${data.product?.name}`,
        timestamp: data.timestamp || new Date(),
        status: 'pending',
        requestId: String(data.requestId || ''),
        color: data.color || '',
        size: data.size || '',
        notes: data.notes || '',
        body: `${data.sender?.name || 'A buyer'} wants to customise ${data.product?.name || 'your product'}`,
        icon: '🎨',
      });
      toast.custom(
        (t) => <CustomizationRequestToast t={t} data={data} onRespond={respondToRequest} />,
        { duration: 30000, position: 'top-right' }
      );
    };

    // Customization Response (for buyers)
    const handleCustomizationResponse = (data) => {
      const accepted = data.available || data.status === 'accepted';
      
      // Store approved customization data for the buyer
      if (accepted && data.productId && !data.isChatRequest) {
        setApprovedCustomizations(prev => ({
          ...prev,
          [String(data.productId)]: {
            requestId: String(data.requestId || ''),
            customizationPrice: data.customizationPrice || 0,
            color: data.color || '',
            size: data.size || '',
            notes: data.notes || '',
            productImage: data.productImage || '',
          },
        }));
      }
      
      addNotification({
        type: 'customization-response',
        title: accepted ? '✨ Customisation Accepted!' : 'Customisation Unavailable',
        body: accepted
          ? `${data.artisan?.name || 'The artisan'} accepted your request for ${data.productName}. You can now place your order!`
          : `${data.artisan?.name || 'The artisan'} cannot fulfil your customisation for ${data.productName}.`,
        sender: data.artisan,
        product: { id: data.productId, name: data.productName, image: data.productImage || '' },
        message: accepted
          ? `Customisation accepted! Price set: Rs. ${data.customizationPrice || 'TBD'}. Tap to order now.`
          : 'Customisation declined.',
        timestamp: data.timestamp || new Date(),
        status: data.status || (accepted ? 'accepted' : 'rejected'),
        requestId: String(data.requestId || ''),
        productId: String(data.productId || ''),
        customizationPrice: data.customizationPrice || 0,
        icon: accepted ? '✨' : '❌',
      });
      
      toast.custom((t) => (
        <div 
          className={`bg-white border-l-4 ${accepted ? 'border-green-500' : 'border-red-500'} rounded-xl shadow-xl overflow-hidden max-w-sm w-full cursor-pointer ${t.visible ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => { toast.dismiss(t.id); if (accepted && data.productId) window.location.href = `/products/${data.productId}?customize=true&requestId=${data.requestId}`; }}
        >
          <div className={`px-4 py-3 ${accepted ? 'bg-green-500' : 'bg-red-500'} flex items-center gap-2`}>
            <span className="text-lg">{accepted ? '✨' : '❌'}</span>
            <p className="text-white font-bold text-sm">{accepted ? 'Customisation Accepted!' : 'Customisation Unavailable'}</p>
          </div>
          <div className="p-4">
            {data.productImage && accepted && (
              <img src={data.productImage} alt="" className="w-12 h-12 rounded-lg object-cover float-right ml-3 mb-1" />
            )}
            <p className="text-sm font-semibold text-gray-900">{data.productName}</p>
            {accepted && data.customizationPrice > 0 && (
              <p className="text-lg font-bold text-green-700 mt-1">Rs. {Number(data.customizationPrice).toLocaleString()}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {accepted ? 'Tap to order now with your customization!' : `The artisan cannot fulfil this customisation.`}
            </p>
            {accepted && <p className="text-xs text-green-600 font-semibold mt-2 clear-both">🛒 Order Now →</p>}
          </div>
        </div>
      ), { duration: 15000, position: 'top-right' });
    };

    // Chat Message Notification
    const handleChatMessage = (data) => {
      addNotification({
        type: 'chat',
        title: 'New Message',
        body: `${data.senderName}: ${data.message}`,
        roomId: data.roomId,
        icon: '💬',
      });
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      toast.custom((t) => (
        <div 
          onClick={() => { toast.dismiss(t.id); window.location.href = `/chat/${data.roomId}`; }}
          style={{ transform: t.visible ? 'translateX(0)' : 'translateX(110%)', transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)', opacity: t.visible ? 1 : 0 }}
          className="flex items-center gap-3 bg-white rounded-2xl shadow-2xl p-3 max-w-xs w-full cursor-pointer border border-gray-100"
        >
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ background: 'linear-gradient(135deg,#075e54,#128c7e)' }}>
              {data.senderName?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-60" />
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-[8px] leading-none">💬</span>
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <p className="font-bold text-gray-900 text-sm truncate">{data.senderName}</p>
              <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">{time}</span>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">{data.message}</p>
            <p className="text-[10px] text-green-600 font-semibold mt-1">Tap to reply →</p>
          </div>
        </div>
      ), { duration: 6000, position: 'top-right' });
    };

    // New Chat Started Notification
    const handleNewChatStarted = (data) => {
      addNotification({
        type: 'chat',
        title: 'New Chat Started',
        body: data.message || 'A buyer started a chat with you',
        roomId: data.roomId,
        icon: '💬',
      });
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      toast.custom((t) => (
        <div 
          onClick={() => { toast.dismiss(t.id); window.location.href = `/chat/${data.roomId}`; }}
          style={{ transform: t.visible ? 'translateX(0)' : 'translateX(110%)', transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)', opacity: t.visible ? 1 : 0 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-xs w-full cursor-pointer border border-gray-100"
        >
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'linear-gradient(90deg,#075e54,#128c7e)' }}>
            <span className="text-base">💬</span>
            <span className="text-white font-bold text-sm">New Message</span>
            <span className="ml-auto text-white/70 text-[10px]">{time}</span>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-gray-900 truncate">{data.buyerName || 'A buyer'} sent you a message</p>
            <p className="text-xs text-gray-500 mt-0.5">"Hello!" — Tap to open chat</p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] text-green-600 font-semibold">Open chat →</span>
            </div>
          </div>
        </div>
      ), { duration: 8000, position: 'top-right' });
    };

    // New Review Notification (for artisans)
    const handleNewReview = (data) => {
      addNotification({
        type: 'new-review',
        title: '⭐ New Review Received!',
        body: `${data.buyerName || 'A buyer'} rated your order ${data.rating}★`,
        icon: '⭐',
        rating: data.rating,
        comment: data.comment,
      });
      toast.custom((t) => (
        <div className={`bg-white border-l-4 border-amber-400 rounded-xl shadow-xl p-4 max-w-sm w-full cursor-pointer ${t.visible ? 'opacity-100' : 'opacity-0'}`} onClick={() => toast.dismiss(t.id)}>
          <p className="font-bold text-gray-900 text-sm">⭐ New Review!</p>
          <p className="text-xs text-gray-600 mt-1">{data.buyerName} gave {data.rating}★ for your order</p>
          {data.comment && <p className="text-xs text-gray-500 mt-1 italic">"{data.comment.slice(0, 60)}..."</p>}
        </div>
      ), { duration: 6000, position: 'top-right' });
    };

    // Admin Notifications
    const handleAdminNewOrder = (data) => {
      addNotification({
        type: 'admin-order',
        title: '🛒 New Order (Admin)',
        body: `Order from ${data.buyerName || 'a buyer'} — LKR ${Number(data.amount || 0).toLocaleString()}`,
        icon: '🛒',
      });
    };

    const handleAdminOrderCancelled = (data) => {
      addNotification({
        type: 'admin-cancel',
        title: 'Order Cancelled (Admin)',
        body: `Order #${data.orderId} cancelled by ${data.buyerName || 'buyer'}`,
        icon: '❌',
      });
    };

    // Register all socket event listeners
    socket.on('new-order', handleNewOrder);
    socket.on('order-status-update', handleStatusUpdate);
    socket.on('order-cancelled', handleOrderCancelled);
    socket.on('customization-request', handleCustomizationRequest);
    socket.on('customization-response', handleCustomizationResponse);
    socket.on('new-message-notification', handleChatMessage);
    socket.on('new-chat-started', handleNewChatStarted);
    socket.on('new-review', handleNewReview);
    socket.on('admin-new-order', handleAdminNewOrder);
    socket.on('admin-order-cancelled', handleAdminOrderCancelled);

    // Cleanup
    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('order-status-update', handleStatusUpdate);
      socket.off('order-cancelled', handleOrderCancelled);
      socket.off('customization-request', handleCustomizationRequest);
      socket.off('customization-response', handleCustomizationResponse);
      socket.off('new-message-notification', handleChatMessage);
      socket.off('new-chat-started', handleNewChatStarted);
      socket.off('new-review', handleNewReview);
      socket.off('admin-new-order', handleAdminNewOrder);
      socket.off('admin-order-cancelled', handleAdminOrderCancelled);
    };
  }, [socket, addNotification, respondToRequest]);

  const contextValue = {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    clearNotifications,
    addNotification,
    approvedCustomizations,
    isCustomizationApproved,
    getCustomizationData,
  };

  return (
    <NotifContext.Provider value={contextValue}>
      {children}
      {/* Delivery Review Popup */}
      {showDeliveryReview && deliveryReviewData && (
        <DeliveryReviewPopup
          data={deliveryReviewData}
          onClose={() => { setShowDeliveryReview(false); setDeliveryReviewData(null); }}
        />
      )}
    </NotifContext.Provider>
  );
};