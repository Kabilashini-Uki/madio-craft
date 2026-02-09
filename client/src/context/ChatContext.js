import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext'; // Assuming you have AuthContext

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState({}); // Store messages by room ID
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth(); // Get user from auth context

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to chat server:', newSocket.id);
    });

    newSocket.on('receive-message', ({ roomId, message, sender, timestamp }) => {
      setMessages(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), { message, sender, timestamp }]
      }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Join room
  const joinRoom = useCallback((roomId) => {
    if (socket && roomId) {
      socket.emit('join-room', roomId);
      setActiveRoom(roomId);
      
      // Load messages for this room
      loadMessages(roomId);
    }
  }, [socket]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (activeRoom && socket) {
      socket.emit('leave-room', activeRoom);
    }
    setActiveRoom(null);
  }, [activeRoom, socket]);

  // Send message
  const sendMessage = useCallback((message, roomId = activeRoom) => {
    if (socket && roomId) {
      socket.emit('send-message', {
        roomId,
        message,
        sender: user?._id
      });
    }
  }, [socket, activeRoom, user]);

  // Load chat rooms
  const loadRooms = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/chat/rooms`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setRooms(res.data.rooms);
      
      // Calculate total unread count
      const totalUnread = res.data.rooms.reduce((sum, room) => {
        const userUnread = room.unreadCount?.[user?._id] || 0;
        return sum + userUnread;
      }, 0);
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error('Failed to load chat rooms:', err);
    }
  }, [user]);

  // Load room messages
  const loadMessages = useCallback(async (roomId) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/chat/rooms/${roomId}/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setMessages(prev => ({
        ...prev,
        [roomId]: res.data.messages || []
      }));
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  // Create or get room
  const createRoom = useCallback(async (artisanId, productId) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/chat/room`, {
        artisanId,
        productId
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setRooms(prev => [res.data.room, ...prev]);
      return res.data.room;
    } catch (err) {
      console.error('Failed to create room:', err);
      return null;
    }
  }, []);

  const value = {
    socket,
    activeRoom,
    rooms,
    messages: messages[activeRoom] || [],
    unreadCount,
    joinRoom,
    leaveRoom,
    sendMessage,
    loadRooms,
    loadMessages,
    createRoom,
    allMessages: messages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};