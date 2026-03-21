// src/pages/Notifications.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiBell, FiCheck, FiTrash2, FiShoppingBag,
    FiTool, FiMessageSquare, FiStar, FiArrowRight,
    FiXCircle, FiCheckCircle, FiClock
} from 'react-icons/fi';
import { useNotif } from '../context/NotifContext';
import { useAuth } from '../context/AuthContext';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        notifications, markRead, markAllRead,
        clearNotifications, unreadCount
    } = useNotif();

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    const getIcon = (type) => {
        switch (type) {
            case 'new-order': return <FiShoppingBag className="text-green-600" />;
            case 'order-status': return <FiCheckCircle className="text-blue-600" />;
            case 'customization-request': return <FiTool className="text-purple-600" />;
            case 'customization-response': return <FiCheck className="text-emerald-600" />;
            case 'chat': return <FiMessageSquare className="text-indigo-600" />;
            case 'new-review': return <FiStar className="text-amber-500" />;
            case 'order-cancelled': return <FiXCircle className="text-red-500" />;
            default: return <FiBell className="text-gray-400" />;
        }
    };

    const getBgColor = (type) => {
        switch (type) {
            case 'new-order': return 'bg-green-50';
            case 'order-status': return 'bg-blue-50';
            case 'customization-request': return 'bg-purple-50';
            case 'customization-response': return 'bg-emerald-50';
            case 'chat': return 'bg-indigo-50';
            case 'new-review': return 'bg-amber-50';
            case 'order-cancelled': return 'bg-red-50';
            default: return 'bg-gray-50';
        }
    };

    const handleClick = (notif) => {
        markRead(notif.id);

        if (notif.type === 'customization-request' || notif.type === 'customization-response') {
            if (notif.requestId) navigate(`/customization/${notif.requestId}`);
            else if (user.role === 'artisan') navigate('/artisan-dashboard?tab=customizations');
            else navigate('/dashboard?tab=customizations');
        } else if (notif.type === 'new-order') {
            navigate('/artisan-dashboard?tab=orders');
        } else if (notif.type === 'order-status') {
            navigate('/dashboard?tab=orders');
        } else if (notif.type === 'chat') {
            navigate(`/chat/${notif.roomId}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-28 pb-16">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <FiBell className="text-amber-700" />
                            Notifications
                            {unreadCount > 0 && (
                                <span className="bg-amber-700 text-white text-xs px-2.5 py-1 rounded-full">
                                    {unreadCount} New
                                </span>
                            )}
                        </h1>
                        <p className="text-gray-500 mt-1">Stay updated with your orders and requests</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={markAllRead}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <FiCheck /> Mark all as read
                        </button>
                        <button
                            onClick={clearNotifications}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                            <FiTrash2 /> Clear all
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    {notifications.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiBell className="h-10 w-10 text-gray-300" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">No notifications yet</h2>
                            <p className="text-gray-500 mt-2">We'll notify you when something important happens.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            <AnimatePresence initial={false}>
                                {notifications.map((notif) => (
                                    <motion.div
                                        key={notif.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`p-6 hover:bg-gray-50 transition-all cursor-pointer relative group ${!notif.read ? 'bg-amber-50/30' : ''
                                            }`}
                                        onClick={() => handleClick(notif)}
                                    >
                                        {!notif.read && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-700" />
                                        )}

                                        <div className="flex gap-5">
                                            <div className={`w-14 h-14 rounded-2xl ${getBgColor(notif.type)} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm`}>
                                                {getIcon(notif.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <h3 className={`font-bold truncate ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                        {notif.title}
                                                    </h3>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                                                        <FiClock className="h-3 w-3" />
                                                        {new Date(notif.timestamp).toLocaleDateString()} at {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                <p className={`text-sm leading-relaxed ${!notif.read ? 'text-gray-700' : 'text-gray-500'}`}>
                                                    {notif.body}
                                                </p>

                                                <div className="mt-4 flex items-center justify-between">
                                                    <span className="text-amber-700 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                                                        View details <FiArrowRight className="h-3.5 w-3.5" />
                                                    </span>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markRead(notif.id);
                                                        }}
                                                        className={`p-2 rounded-lg transition-colors ${!notif.read ? 'text-amber-700 hover:bg-amber-100' : 'text-gray-300 cursor-default'
                                                            }`}
                                                        title="Mark as read"
                                                        disabled={notif.read}
                                                    >
                                                        <FiCheck className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
