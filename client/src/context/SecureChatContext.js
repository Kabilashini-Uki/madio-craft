// src/context/SecureChatContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SecureChatContext = createContext();

export const useSecureChat = () => {
  const context = useContext(SecureChatContext);
  if (!context) {
    throw new Error('useSecureChat must be used within a SecureChatProvider');
  }
  return context;
};

export const SecureChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const { user, token, isAuthenticated } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const socketUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';
    
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('🔐 Secure chat connected:', newSocket.id);
      setConnected(true);
      newSocket.emit('register-user', user._id || user.id);
    });

    newSocket.on('disconnect', () => {
      console.log('🔐 Secure chat disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('receive-message', (data) => {
      const { roomId, message, sender, timestamp, customizationId, _id } = data;
      
      setMessages(prev => {
        const roomMessages = prev[roomId] || [];
        // Avoid duplicates
        if (roomMessages.some(m => m._id === _id)) return prev;
        
        return {
          ...prev,
          [roomId]: [...roomMessages, { 
            _id,
            message, 
            sender, 
            timestamp, 
            customizationId,
            isOwn: sender === (user._id || user.id)
          }]
        };
      });

      if (sender !== (user._id || user.id)) {
        setUnreadCount(prev => prev + 1);
        toast.custom((t) => (
          <div 
            onClick={() => window.location.href = `/chat/${roomId}`}
            className="bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:bg-gray-50 border-l-4 border-primary"
          >
            <p className="font-semibold text-sm">New message</p>
            <p className="text-xs text-gray-600 mt-1">{message.substring(0, 50)}...</p>
          </div>
        ), { duration: 3000 });
      }
    });

    newSocket.on('user-typing', ({ roomId, isTyping, userId }) => {
      // Handle typing indicator
      console.log(`User ${userId} is ${isTyping ? 'typing' : 'not typing'} in room ${roomId}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [isAuthenticated, user, token]);

  const joinRoom = useCallback(async (roomId) => {
    if (!socket || !roomId) return false;
    
    try {
      socket.emit('join-room', roomId);
      setActiveRoom(roomId);
      
      // Load messages
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await axios.get(
        `${apiUrl}/chat/rooms/${roomId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const loadedMessages = (response.data.messages || []).map(msg => ({
          ...msg,
          isOwn: msg.sender === (user._id || user.id)
        }));
        
        setMessages(prev => ({
          ...prev,
          [roomId]: loadedMessages
        }));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to join room:', error);
      toast.error('Failed to load chat messages');
      return false;
    } finally {
      setLoading(false);
    }
  }, [socket, token, user]);

  const leaveRoom = useCallback(() => {
    if (activeRoom && socket) {
      socket.emit('leave-room', activeRoom);
      setActiveRoom(null);
    }
  }, [activeRoom, socket]);

  const sendMessage = useCallback(async (message, customizationId = null) => {
    if (!socket || !activeRoom || !message.trim()) return false;

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await axios.post(
        `${apiUrl}/chat/messages`,
        { 
          roomId: activeRoom, 
          message: message.trim(), 
          customizationId,
          type: 'text'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      return false;
    }
  }, [socket, activeRoom, token]);

  const sendTyping = useCallback((isTyping) => {
    if (socket && activeRoom) {
      socket.emit('typing', { roomId: activeRoom, isTyping });
    }
  }, [socket, activeRoom]);

  const createCustomizationRoom = useCallback(async (artisanId, productId, customizationData = {}) => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await axios.post(
        `${apiUrl}/chat/customization/room`,
        { artisanId, productId, customizationData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const room = response.data.room;
        setRooms(prev => {
          // Check if room already exists in list
          if (prev.some(r => r._id === room._id)) return prev;
          return [room, ...prev];
        });
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
  }, [token]);

  const updateCustomization = useCallback(async (roomId, updates) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await axios.put(
        `${apiUrl}/chat/customization/${roomId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.success;
    } catch (error) {
      console.error('Failed to update customization:', error);
      toast.error('Failed to update customization');
      return false;
    }
  }, [token]);

  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await axios.get(
        `${apiUrl}/chat/rooms`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setRooms(response.data.rooms || []);
        
        // Calculate total unread
        const totalUnread = (response.data.rooms || []).reduce((sum, room) => {
          return sum + (room.unreadCount?.[user?._id] || 0);
        }, 0);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const value = {
    socket,
    activeRoom,
    rooms,
    messages,
    unreadCount,
    loading,
    connected,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    createCustomizationRoom,
    updateCustomization,
    loadRooms,
  };

  return (
    <SecureChatContext.Provider value={value}>
      {children}
    </SecureChatContext.Provider>
  );
};