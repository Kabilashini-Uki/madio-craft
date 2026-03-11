// src/context/SecureChatContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';

const SecureChatContext = createContext();

export const useSecureChat = () => {
  const context = useContext(SecureChatContext);
  if (!context) throw new Error('useSecureChat must be used within a SecureChatProvider');
  return context;
};

export const SecureChatProvider = ({ children }) => {
  const [activeRoom, setActiveRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const { user, isAuthenticated } = useAuth();
  // Reuse the shared socket from SocketContext — no duplicate connections
  const { socket } = useSocket();
  const connected = !!socket?.connected;

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data) => {
      const { roomId, message, sender, timestamp, customizationId, _id } = data;
      setMessages(prev => {
        const roomMessages = prev[roomId] || [];
        if (roomMessages.some(m => m._id === _id)) return prev;
        return {
          ...prev,
          [roomId]: [...roomMessages, {
            _id, message, sender, timestamp, customizationId,
            isOwn: sender === (user?._id || user?.id)
          }]
        };
      });

      if (sender !== (user?._id || user?.id)) {
        setUnreadCount(prev => prev + 1);
        toast.custom((t) => (
          <div onClick={() => window.location.href = `/chat/${roomId}`}
            className="bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:bg-gray-50 border-l-4 border-primary">
            <p className="font-semibold text-sm">New message</p>
            <p className="text-xs text-gray-600 mt-1">{message.substring(0, 50)}...</p>
          </div>
        ), { duration: 3000 });
      }
    };

    const handleTyping = ({ roomId, isTyping, userId }) => {
      console.log(`User ${userId} is ${isTyping ? 'typing' : 'not typing'} in room ${roomId}`);
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('user-typing', handleTyping);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('user-typing', handleTyping);
    };
  }, [socket, user]);

  const joinRoom = useCallback(async (roomId) => {
    if (!socket || !roomId) return false;
    try {
      socket.emit('join-room', roomId);
      setActiveRoom(roomId);
      setLoading(true);
      const response = await api.get(`/chat/rooms/${roomId}/messages`);
      if (response.data.success) {
        const loadedMessages = (response.data.messages || []).map(msg => ({
          ...msg, isOwn: msg.sender === (user?._id || user?.id)
        }));
        setMessages(prev => ({ ...prev, [roomId]: loadedMessages }));
      }
      return true;
    } catch (error) {
      console.error('Failed to join room:', error);
      toast.error('Failed to load chat messages');
      return false;
    } finally {
      setLoading(false);
    }
  }, [socket, user]);

  const leaveRoom = useCallback(() => {
    if (activeRoom && socket) { socket.emit('leave-room', activeRoom); setActiveRoom(null); }
  }, [activeRoom, socket]);

  const sendMessage = useCallback(async (message, customizationId = null) => {
    if (!socket || !activeRoom || !message.trim()) return false;
    try {
      const response = await api.post('/chat/messages', {
        roomId: activeRoom, message: message.trim(), customizationId, type: 'text'
      });
      return response.data.success || false;
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      return false;
    }
  }, [socket, activeRoom]);

  const sendTyping = useCallback((isTyping) => {
    if (socket && activeRoom) socket.emit('typing', { roomId: activeRoom, isTyping });
  }, [socket, activeRoom]);

  const createCustomizationRoom = useCallback(async (artisanId, productId, customizationData = {}) => {
    try {
      setLoading(true);
      const response = await api.post('/chat/customization/room', { artisanId, productId, customizationData });
      if (response.data.success) {
        const room = response.data.room;
        setRooms(prev => prev.some(r => r._id === room._id) ? prev : [room, ...prev]);
        return room;
      }
      return null;
    } catch (error) {
      console.error('Failed to create room:', error);
      toast.error(error.response?.data?.message || 'Failed to start chat');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCustomization = useCallback(async (roomId, updates) => {
    try {
      const response = await api.put(`/chat/customization/${roomId}`, updates);
      return response.data.success;
    } catch (error) {
      console.error('Failed to update customization:', error);
      toast.error('Failed to update customization');
      return false;
    }
  }, []);

  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/chat/rooms');
      if (response.data.success) {
        setRooms(response.data.rooms || []);
        const totalUnread = (response.data.rooms || []).reduce(
          (sum, room) => sum + (room.unreadCount?.[user?._id] || 0), 0
        );
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const value = {
    socket, activeRoom, rooms, messages, unreadCount, loading, connected,
    joinRoom, leaveRoom, sendMessage, sendTyping, createCustomizationRoom,
    updateCustomization, loadRooms,
  };

  return (
    <SecureChatContext.Provider value={value}>
      {children}
    </SecureChatContext.Provider>
  );
};
