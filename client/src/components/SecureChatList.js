// src/components/SecureChatList.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiMessageCircle, FiClock, FiCheck, FiCheckCircle,
  FiLock, FiShoppingBag, FiPackage
} from 'react-icons/fi';
import { useSecureChat } from '../context/SecureChatContext';
import { useAuth } from '../context/AuthContext';

const SecureChatList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rooms, loadRooms, joinRoom, unreadCount } = useSecureChat();

  useEffect(() => {
    loadRooms();
  }, []);

  const handleOpenChat = async (room) => {
    const success = await joinRoom(room._id);
    if (success) {
      navigate(`/chat/${room._id}`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <FiCheckCircle className="text-green-500" />;
      case 'quote_sent':
        return <FiClock className="text-orange-500" />;
      case 'in_progress':
        return <FiMessageCircle className="text-primary" />;
      default:
        return <FiLock className="text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <FiMessageCircle className="mr-2 text-primary" />
          Customization Chats
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {unreadCount} new
            </span>
          )}
        </h3>
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {rooms.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No active customization chats</p>
            <p className="text-sm text-gray-400 mt-2">
              Start customizing a product to begin chatting
            </p>
          </div>
        ) : (
          rooms.map((room) => (
            <motion.div
              key={room._id}
              whileHover={{ x: 4 }}
              onClick={() => handleOpenChat(room)}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start space-x-3">
                {/* Product Image */}
                <div className="relative">
                  <img
                    src={room.product?.image || 'https://via.placeholder.com/50'}
                    alt={room.product?.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  {room.unreadCount?.[user?._id] > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {room.unreadCount[user._id]}
                    </span>
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {room.product?.name}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {new Date(room.lastMessage?.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                    {room.lastMessage?.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img
                        src={room.participants?.find(p => p._id !== user?._id)?.avatar || 'https://via.placeholder.com/24'}
                        alt="artisan"
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-xs text-gray-500">
                        {room.participants?.find(p => p._id !== user?._id)?.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400 flex items-center">
                        <FiLock className="mr-1 h-3 w-3" />
                        Private
                      </span>
                      <span className={`text-sm ${
                        room.customization?.status === 'accepted' ? 'text-green-600' :
                        room.customization?.status === 'quote_sent' ? 'text-orange-600' :
                        'text-primary'
                      }`}>
                        {getStatusIcon(room.customization?.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customization Summary */}
              {room.customization && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Options: {Object.keys(room.customization.options || {}).length}
                    </span>
                    <span className="font-medium text-primary">
                      Rs{room.customization.price}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default SecureChatList;