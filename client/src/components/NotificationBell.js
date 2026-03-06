// components/NotificationBell.js
// A bell icon for the Navbar that shows unread notification count.
// Opens a dropdown with all recent notifications when clicked.
// Uses NotifContext for state and SocketContext events (handled in NotifContext).

import React, { useState, useRef, useEffect } from 'react';
import { FiBell, FiX, FiPackage, FiShoppingBag, FiMessageCircle, FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotif } from '../context/NotifContext';
import { useNavigate } from 'react-router-dom';

// Icon map by notification type
const ICONS = {
  'new-order': { Icon: FiShoppingBag, color: 'text-green-600', bg: 'bg-green-50' },
  'order-status': { Icon: FiPackage, color: 'text-blue-600', bg: 'bg-blue-50' },
  'order-cancelled': { Icon: FiAlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  'chat': { Icon: FiMessageCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
};

const NotificationBell = () => {
  const { notifications, unreadCount, markAllRead, markRead } = useNotif();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleToggle = () => {
    setOpen(prev => !prev);
    if (!open && unreadCount > 0) markAllRead();
  };

  const handleNotifClick = (notif) => {
    markRead(notif.id);
    setOpen(false);
    // Navigate based on type
    if (notif.type === 'chat' && notif.roomId) navigate(`/chat/${notif.roomId}`);
    else if (notif.type === 'new-order' || notif.type === 'order-cancelled') navigate('/artisan-dashboard');
    else navigate('/dashboard');
  };

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
        aria-label="Notifications"
      >
        <FiBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center space-x-2">
                <FiBell className="h-4 w-4 text-amber-700" />
                <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <FiBell className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const iconData = ICONS[notif.type] || ICONS['order-status'];
                  const { Icon, color, bg } = iconData;
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full flex items-start space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-amber-50/40' : ''}`}
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="text-xs font-semibold text-gray-900 leading-tight">{notif.title}</p>
                          {!notif.read && (
                            <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-1 ml-2" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">{notif.body}</p>
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.timestamp)}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={markAllRead}
                  className="text-xs text-amber-700 hover:text-amber-900 font-medium transition-colors"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;