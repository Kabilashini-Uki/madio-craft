// src/pages/Chat.js - Secure chat between buyer and artisan
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSend, FiArrowLeft, FiUser, FiLock,
  FiAlertTriangle, FiLoader, FiCheckCircle
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const Chat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [typing, setTyping] = useState(false);
  const [socket, setSocket] = useState(null);
  const chatEndRef = useRef(null);
  const typingTimeout = useRef(null);

  // Initialize socket
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socketUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
    });

    newSocket.on('connect', () => {
      newSocket.emit('join-room', roomId);
    });

    newSocket.on('receive-message', (data) => {
      if (data.roomId === roomId) {
        setMessages(prev => {
          // Avoid duplicates (message might already be added optimistically)
          const exists = prev.find(m => m._id === data._id);
          if (exists) return prev;
          return [...prev, {
            ...data,
            isOwn: data.sender === user?._id || data.sender === user?.id
          }];
        });
      }
    });

    newSocket.on('user-typing', ({ isTyping: t }) => setTyping(t));

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [roomId, user]);

  // Verify access and load messages
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Verify the user has access to this room
        const verifyRes = await api.get(`/chat/rooms/${roomId}/verify`);
        if (!verifyRes.data.hasAccess) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        // Get messages
        const msgRes = await api.get(`/chat/rooms/${roomId}/messages`);
        const rawMessages = msgRes.data.messages || [];
        const userId = user?._id || user?.id;
        setMessages(rawMessages.map(m => ({
          ...m,
          isOwn: m.sender === userId || m.sender?._id === userId || m.sender?.toString() === userId
        })));

        // Try to get room info
        try {
          const roomsRes = await api.get('/chat/rooms');
          const room = roomsRes.data.rooms?.find(r => r._id === roomId);
          if (room) {
            setRoomInfo(room);
            const other = room.participants?.find(p =>
              (p._id || p)?.toString() !== userId?.toString()
            );
            setOtherUser(other);
          }
        } catch {}
      } catch (e) {
        console.error('Chat init error:', e);
        if (e.response?.status === 403) setAccessDenied(true);
        else toast.error('Failed to load chat');
      } finally {
        setLoading(false);
      }
    };
    if (roomId && user) init();
  }, [roomId, user]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    const text = message.trim();
    setMessage('');
    setSending(true);

    const userId = user?._id || user?.id;
    // Optimistic update
    const tempMsg = {
      _id: `temp-${Date.now()}`,
      message: text,
      sender: userId,
      isOwn: true,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await api.post('/chat/messages', { roomId, message: text });
      // Replace temp message with real one
      setMessages(prev => prev.map(m =>
        m._id === tempMsg._id ? { ...res.data.message, isOwn: true } : m
      ));
    } catch (e) {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
      setMessage(text);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (socket) {
      socket.emit('typing', { roomId, isTyping: true });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('typing', { roomId, isTyping: false });
      }, 1500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <FiAlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">You don't have permission to view this conversation. Chats are private and only accessible by the buyer and artisan involved in the order.</p>
          <button onClick={() => navigate(-1)} className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4 flex items-center space-x-4 sticky top-20 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <FiArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold flex-shrink-0">
          {otherUser?.name?.[0] || '?'}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{otherUser?.name || 'Chat'}</p>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <FiLock className="h-3 w-3" />
            <span>Secure conversation</span>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-full">
          <FiCheckCircle className="h-3 w-3 text-green-600" />
          <span className="text-xs text-green-700 font-medium">End-to-end secured</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl w-full mx-auto">
        {/* Info Banner */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full text-xs text-gray-500">
            <FiLock className="h-3 w-3" />
            <span>This conversation is private. Only you and {otherUser?.name || 'the other party'} can see these messages.</span>
          </div>
        </div>

        {messages.length === 0 && (
          <div className="text-center py-10">
            <FiUser className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Start the conversation!</p>
            <p className="text-gray-400 text-xs mt-1">Discuss customization details, order progress, or any questions</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={msg._id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
              {!msg.isOwn && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 mr-2 flex-shrink-0 self-end">
                  {otherUser?.name?.[0] || '?'}
                </div>
              )}
              <div className={`max-w-[70%] ${msg.isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`px-4 py-3 rounded-2xl text-sm ${
                  msg.isOwn
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-white shadow-sm text-gray-900 rounded-bl-sm'
                }`}>
                  {msg.message}
                </div>
                <p className="text-xs text-gray-400 mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
              {otherUser?.name?.[0] || '?'}
            </div>
            <div className="bg-white shadow-sm rounded-2xl px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center space-x-3">
          <input
            value={message}
            onChange={handleTyping}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary outline-none text-sm bg-gray-50 focus:bg-white transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg flex-shrink-0">
            {sending ? <FiLoader className="h-5 w-5 animate-spin" /> : <FiSend className="h-5 w-5" />}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Messages are private between you and {otherUser?.name || 'the other party'}</p>
      </div>
    </div>
  );
};

export default Chat;
