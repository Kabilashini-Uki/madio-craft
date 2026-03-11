// components/NotificationBell.js
// Bell icon for the Navbar.
// Customization notifications display: sender, product, message, timestamp, status badge.

import React, { useState, useRef, useEffect } from 'react';
import { FiBell, FiX, FiPackage, FiShoppingBag, FiMessageCircle, FiAlertTriangle, FiTool, FiUserPlus } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotif } from '../context/NotifContext';
import { useNavigate } from 'react-router-dom';

const ICONS = {
  'new-order':              { Icon: FiShoppingBag,    color: 'text-green-600',  bg: 'bg-green-50' },
  'order-status':           { Icon: FiPackage,         color: 'text-blue-600',   bg: 'bg-blue-50' },
  'order-cancelled':        { Icon: FiAlertTriangle,   color: 'text-red-600',    bg: 'bg-red-50' },
  'chat':                   { Icon: FiMessageCircle,   color: 'text-purple-600', bg: 'bg-purple-50' },
  'customization-request':  { Icon: FiTool,            color: 'text-violet-600', bg: 'bg-violet-50' },
  'customization-response': { Icon: FiTool,            color: 'text-indigo-600', bg: 'bg-indigo-50' },
  'new-registration':       { Icon: FiUserPlus,        color: 'text-indigo-600', bg: 'bg-indigo-50' },
};

/* ── Status badge ─────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  if (!status) return null;
  const map = {
    pending:  { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700' },
    accepted: { label: 'Accepted', cls: 'bg-green-100  text-green-700'  },
    rejected: { label: 'Declined', cls: 'bg-red-100    text-red-700'    },
  };
  const cfg = map[status];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

const NotificationBell = () => {
  const { notifications, unreadCount, markAllRead, markRead, clearNotifications } = useNotif();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
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
    if (notif.type === 'chat' && notif.roomId) navigate(`/chat/${notif.roomId}`);
    else if (notif.type === 'new-order' || notif.type === 'order-cancelled') navigate('/artisan-dashboard');
    else if (notif.type === 'customization-request')  navigate('/artisan-dashboard?tab=customizations');
    else if (notif.type === 'customization-response' && notif.productId) { const url = notif.actionUrl || `/products/${notif.productId}?customize=true&requestId=${notif.requestId}`; navigate(url); }
    else navigate('/dashboard');
  };

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  /* Render the body text for a notification */
  const renderBody = (notif) => {
    if (notif.type === 'customization-request' || notif.type === 'customization-response') {
      return (
        <div className="space-y-0.5">
          {/* Sender */}
          {notif.sender?.name && (
            <p className="text-[11px] text-gray-700 font-medium">
              From: <span className="text-gray-900">{notif.sender.name}</span>
            </p>
          )}
          {/* Product */}
          {notif.product?.name && (
            <p className="text-[11px] text-gray-600">
              Product: <span className="font-medium text-gray-800">{notif.product.name}</span>
            </p>
          )}
          {/* Message */}
          {notif.message && (
            <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{notif.message}</p>
          )}
        </div>
      );
    }
    return <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">{notif.body}</p>;
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
            initial={{ scale: 0 }} animate={{ scale: 1 }}
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
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-84 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            style={{ width: 340 }}
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
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <FiBell className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const { Icon, color, bg } = ICONS[notif.type] || ICONS['order-status'];
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
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-semibold text-gray-900 leading-tight">{notif.title}</p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {notif.status && <StatusBadge status={notif.status} />}
                            {!notif.read && (
                              <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        {renderBody(notif)}
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.timestamp)}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <button
                  onClick={markAllRead}
                  className="text-xs text-amber-700 hover:text-amber-900 font-medium transition-colors"
                >
                  Mark all as read
                </button>
                <button
                  onClick={() => { clearNotifications(); setOpen(false); }}
                  className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors"
                >
                  Clear all
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
