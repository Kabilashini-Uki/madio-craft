// src/pages/Chat.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiSend, FiArrowLeft, FiUser, FiPaperclip,
  FiClock, FiCheck, FiCheckCircle
} from 'react-icons/fi';
import { useSecureChat } from '../context/SecureChatContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Chat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    joinRoom, 
    leaveRoom, 
    sendMessage, 
    messages, 
    activeRoom,
    loading 
  } = useSecureChat();
  
  const [message, setMessage] = useState('');
  const [roomDetails, setRoomDetails] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (roomId) {
      joinRoom(roomId);
    }

    return () => {
      leaveRoom();
    };
  }, [roomId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    const success = await sendMessage(message);
    if (success) {
      setMessage('');
    }
  };

  const currentMessages = messages[roomId] || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-sm p-4 flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">Customization Chat</h2>
            <p className="text-sm text-gray-500">Room ID: {roomId?.slice(-8)}</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <FiClock className="h-4 w-4" />
            <span>Real-time</span>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white border-t border-b h-[60vh] overflow-y-auto p-6 space-y-4">
          {currentMessages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Send a message to start the conversation
              </p>
            </div>
          ) : (
            currentMessages.map((msg, index) => (
              <div
                key={msg._id || index}
                className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  msg.isOwn
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}>
                  {!msg.isOwn && (
                    <p className="text-xs font-medium text-primary mb-1">
                      {msg.senderName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <div className="flex items-center justify-end mt-1 space-x-1">
                    <span className={`text-xs ${
                      msg.isOwn ? 'text-primary-light' : 'text-gray-500'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {msg.isOwn && msg.status === 'sending' && (
                      <FiClock className="h-3 w-3 opacity-70" />
                    )}
                    {msg.isOwn && msg.status === 'sent' && (
                      <FiCheck className="h-3 w-3 opacity-70" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white rounded-b-2xl shadow-sm p-4">
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg">
              <FiPaperclip className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="p-2 bg-primary text-white rounded-full hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSend className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Messages are end-to-end encrypted
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;