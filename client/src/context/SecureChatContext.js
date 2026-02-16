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
  
  const { user, token, isAuthenticated } = useAuth();

  console.log('SecureChatContext - Auth state:', { user, isAuthenticated, token });

  // Initialize socket connection only when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user || !token) {
      console.log('Not authenticated, skipping socket connection');
      return;
    }

    console.log('Initializing socket connection for user:', user._id);

    const socketUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔐 Secure chat connected:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('receive-message', ({ roomId, message, sender, timestamp, customizationId }) => {
      setMessages(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), { 
          message, 
          sender, 
          timestamp, 
          customizationId,
          isOwn: sender === user._id 
        }]
      }));

      if (sender !== user._id) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user, token]);

  // Join room with security check
  const joinRoom = useCallback(async (roomId) => {
    if (!socket || !isAuthenticated || !user) {
      console.log('Cannot join room: not authenticated');
      toast.error('Please login to join chat');
      return false;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/chat/rooms/${roomId}/verify`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.hasAccess) {
        socket.emit('join-room', roomId);
        setActiveRoom(roomId);
        await loadMessages(roomId);
        return true;
      } else {
        toast.error('You do not have access to this chat');
        return false;
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      toast.error('Cannot access chat room');
      return false;
    }
  }, [socket, isAuthenticated, user, token]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (activeRoom && socket) {
      socket.emit('leave-room', activeRoom);
    }
    setActiveRoom(null);
  }, [activeRoom, socket]);

  // Send message with authentication check
  const sendMessage = useCallback(async (message, customizationId = null) => {
    if (!socket || !activeRoom || !isAuthenticated || !user) {
      console.log('Cannot send message: not authenticated');
      toast.error('Please login to send messages');
      return false;
    }

    try {
      const messageData = {
        roomId: activeRoom,
        message,
        sender: user._id,
        senderName: user.name,
        senderAvatar: user.avatar?.url,
        customizationId,
        timestamp: new Date().toISOString()
      };

      socket.emit('send-message', messageData);

      setMessages(prev => ({
        ...prev,
        [activeRoom]: [...(prev[activeRoom] || []), {
          ...messageData,
          isOwn: true,
          status: 'sending'
        }]
      }));

      return true;
    } catch (error) {
      toast.error('Failed to send message');
      return false;
    }
  }, [socket, activeRoom, isAuthenticated, user]);

  // Create or get secure chat room for customization
  const createCustomizationRoom = useCallback(async (artisanId, productId, customizationData) => {
    if (!isAuthenticated || !user) {
      toast.error('Please login to start customization');
      return null;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/chat/customization/room`,
        {
          artisanId,
          productId,
          customizationData
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { room } = response.data;
      
      setRooms(prev => [room, ...prev]);
      
      toast.success('Chat room created');
      return room;
    } catch (error) {
      console.error('Failed to create room:', error);
      toast.error(error.response?.data?.message || 'Failed to start chat');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, token]);

  // Load messages
  const loadMessages = useCallback(async (roomId, page = 1) => {
    if (!token) return [];

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/chat/rooms/${roomId}/messages`,
        { 
          params: { page, limit: 50 },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessages(prev => ({
        ...prev,
        [roomId]: response.data.messages || []
      }));

      return response.data.messages;
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  }, [token]);

  // Load user's chat rooms
  const loadRooms = useCallback(async () => {
    if (!token || !isAuthenticated) return;

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/chat/rooms`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRooms(response.data.rooms || []);
      
      const totalUnread = response.data.rooms.reduce((sum, room) => {
        const userUnread = room.unreadCount?.[user?._id] || 0;
        return sum + userUnread;
      }, 0);
      
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  }, [token, isAuthenticated, user]);

  // Mock data for demonstration
  const mockRooms = [
    {
      _id: 'room1',
      participants: [
        { _id: user?._id || 'user1', name: 'You', avatar: null },
        { _id: 'artisan1', name: 'Priya Sharma', avatar: null }
      ],
      product: {
        _id: 'prod1',
        name: 'Handcrafted Ceramic Vase',
        image: 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=200'
      },
      customization: {
        status: 'in_progress',
        options: { color: 'Blue', size: 'Medium' },
        price: 2499
      },
      lastMessage: {
        message: 'I can make it with the blue glaze you requested',
        timestamp: new Date().toISOString()
      },
      unreadCount: { [user?._id || 'user1']: 2 }
    }
  ];

  const mockMessages = {
    room1: user ? [
      {
        _id: 'msg1',
        message: 'Hi, I\'d like to customize this vase with blue glaze',
        sender: user._id,
        senderName: user.name,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isOwn: true
      },
      {
        _id: 'msg2',
        message: 'Sure! I have a beautiful blue glaze that would work well',
        sender: 'artisan1',
        senderName: 'Priya Sharma',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        isOwn: false
      }
    ] : []
  };

  const value = {
    socket,
    activeRoom,
    rooms: isAuthenticated ? (rooms.length > 0 ? rooms : mockRooms) : [],
    messages: isAuthenticated ? (Object.keys(messages).length > 0 ? messages : mockMessages) : {},
    unreadCount,
    loading,
    joinRoom,
    leaveRoom,
    sendMessage,
    loadRooms,
    loadMessages,
    createCustomizationRoom,
    isAuthenticated
  };

  return (
    <SecureChatContext.Provider value={value}>
      {children}
    </SecureChatContext.Provider>
  );
};