// context/NotifContext.js
// Manages all in-app notifications (new orders, order status, cancellations, chat).
// Reads the socket from SocketContext so no prop-drilling is needed.

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from './SocketContext';

const NotifContext = createContext();
export const useNotif = () => useContext(NotifContext);

export const NotifProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { socket } = useSocket();

  // Add a notification to the list (max 50 kept in memory)
  const addNotification = useCallback((notif) => {
    setNotifications(prev =>
      [{ ...notif, id: Date.now(), read: false, timestamp: new Date() }, ...prev].slice(0, 50)
    );
  }, []);

  // Convenience helper for plain toasts
  const addToast = useCallback((msg, type = 'success') => {
    if (type === 'error') toast.error(msg);
    else toast.success(msg);
  }, []);

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Socket event subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Artisan: new order placed by a buyer
    const handleNewOrder = (data) => {
      addNotification({
        type: 'new-order',
        title: 'New Order Received!',
        body: `Order #${data.orderId} — LKR ${Number(data.amount || 0).toLocaleString()}`,
        icon: '🛒',
      });
      toast.custom(
        (t) => (
          <div
            className={`bg-white border-l-4 border-green-500 rounded-xl shadow-xl p-4 max-w-sm w-full cursor-pointer ${t.visible ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => toast.dismiss(t.id)}
          >
            <p className="font-bold text-gray-900 text-sm">🛒 New Order Received!</p>
            <p className="text-xs text-gray-600 mt-1">
              Order <span className="font-semibold text-green-700">#{data.orderId}</span> — LKR {Number(data.amount || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">Check your dashboard to manage it.</p>
          </div>
        ),
        { duration: 7000, position: 'top-right' }
      );
    };

    // Buyer: artisan updated the order status
    const handleStatusUpdate = (data) => {
      addNotification({
        type: 'order-status',
        title: 'Order Status Updated',
        body: `Order #${data.orderId} → "${data.status}"`,
        icon: '📦',
      });
      toast.custom(
        (t) => (
          <div
            className={`bg-white border-l-4 border-blue-500 rounded-xl shadow-xl p-4 max-w-sm w-full cursor-pointer ${t.visible ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => toast.dismiss(t.id)}
          >
            <p className="font-bold text-gray-900 text-sm">📦 Order Status Updated</p>
            <p className="text-xs text-gray-600 mt-1">
              Order <span className="font-semibold">#{data.orderId}</span> is now{' '}
              <span className="font-semibold text-blue-700 capitalize">{data.status}</span>
            </p>
          </div>
        ),
        { duration: 5000, position: 'top-right' }
      );
    };

    // Artisan: buyer cancelled an order
    const handleOrderCancelled = (data) => {
      addNotification({
        type: 'order-cancelled',
        title: 'Order Cancelled',
        body: data.message || `Order #${data.orderId} was cancelled by the buyer`,
        icon: '❌',
      });
      toast.custom(
        (t) => (
          <div
            className={`bg-white border-l-4 border-red-500 rounded-xl shadow-xl p-4 max-w-sm w-full cursor-pointer ${t.visible ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => toast.dismiss(t.id)}
          >
            <p className="font-bold text-gray-900 text-sm">❌ Order Cancelled</p>
            <p className="text-xs text-gray-600 mt-1">
              {data.message || `Order #${data.orderId} was cancelled`}
            </p>
          </div>
        ),
        { duration: 6000, position: 'top-right' }
      );
    };

    // Chat: new message (existing feature, now stored in list too)
    const handleChatMessage = (data) => {
      addNotification({
        type: 'chat',
        title: 'New Message',
        body: `${data.senderName}: ${data.message}`,
        roomId: data.roomId,
        icon: '💬',
      });
    };

    socket.on('new-order', handleNewOrder);
    socket.on('order-status-update', handleStatusUpdate);
    socket.on('order-cancelled', handleOrderCancelled);
    socket.on('new-message-notification', handleChatMessage);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('order-status-update', handleStatusUpdate);
      socket.off('order-cancelled', handleOrderCancelled);
      socket.off('new-message-notification', handleChatMessage);
    };
  }, [socket, addNotification]);

  return (
    <NotifContext.Provider value={{ addToast, addNotification, notifications, markRead, markAllRead, unreadCount }}>
      {children}
    </NotifContext.Provider>
  );
};
