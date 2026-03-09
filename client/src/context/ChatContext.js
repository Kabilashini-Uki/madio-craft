import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to chat server:', newSocket.id);
    });

    newSocket.on('receive-message', ({ roomId, message, sender, timestamp }) => {
      setMessages(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), { message, sender, timestamp }]
      }));
    });

    return () => { newSocket.disconnect(); };
  }, [user]);

  const joinRoom = useCallback((roomId) => {
    if (socket && roomId) {
      socket.emit('join-room', roomId);
      setActiveRoom(roomId);
      loadMessages(roomId);
    }
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (activeRoom && socket) {
      socket.emit('leave-room', activeRoom);
    }
    setActiveRoom(null);
  }, [activeRoom, socket]);

  const sendMessage = useCallback((message, roomId = activeRoom) => {
    if (socket && roomId) {
      socket.emit('send-message', { roomId, message, sender: user?._id });
    }
  }, [socket, activeRoom, user]);

  const loadRooms = useCallback(async () => {
    try {
      const res = await api.get('/chat/rooms');
      setRooms(res.data.rooms);
      const totalUnread = res.data.rooms.reduce((sum, room) => {
        return sum + (room.unreadCount?.[user?._id] || 0);
      }, 0);
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error('Failed to load chat rooms:', err);
    }
  }, [user]);

  const loadMessages = useCallback(async (roomId) => {
    try {
      const res = await api.get(`/chat/rooms/${roomId}/messages`);
      setMessages(prev => ({ ...prev, [roomId]: res.data.messages || [] }));
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  const createRoom = useCallback(async (artisanId, productId) => {
    try {
      const res = await api.post('/chat/room', { artisanId, productId });
      setRooms(prev => [res.data.room, ...prev]);
      return res.data.room;
    } catch (err) {
      console.error('Failed to create room:', err);
      return null;
    }
  }, []);

  const value = {
    socket, activeRoom, rooms,
    messages: messages[activeRoom] || [],
    unreadCount, joinRoom, leaveRoom,
    sendMessage, loadRooms, loadMessages, createRoom,
    allMessages: messages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
