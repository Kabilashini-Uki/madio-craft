import React, { createContext, useState, useContext, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL?.replace('/api', ''));
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Join room
  const joinRoom = (roomId) => {
    if (socket && roomId) {
      socket.emit('join-room', roomId);
      setActiveRoom(roomId);
    }
  };

  // Leave room
  const leaveRoom = () => {
    setActiveRoom(null);
    setMessages([]);
  };

  // Send message
  const sendMessage = (message) => {
    if (socket && activeRoom) {
      socket.emit('send-message', {
        roomId: activeRoom,
        message,
        sender: 'user' // This should be user ID from auth context
      });
    }
  };

  // Listen for messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = ({ message, sender, timestamp }) => {
      setMessages(prev => [...prev, { message, sender, timestamp }]);
    };

    socket.on('receive-message', handleReceiveMessage);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
    };
  }, [socket]);

  // Load chat rooms
  const loadRooms = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/chat/rooms`);
      setRooms(res.data.rooms);
      
      // Calculate total unread count
      let totalUnread = 0;
      res.data.rooms.forEach(room => {
        totalUnread += room.unreadCount?.get(userId) || 0;
      });
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error('Failed to load chat rooms:', err);
    }
  };

  // Load room messages
  const loadMessages = async (roomId) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/chat/rooms/${roomId}/messages`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  // Create or get room
  const createRoom = async (artisanId, productId) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/chat/room`, {
        artisanId,
        productId
      });
      
      setRooms(prev => [res.data.room, ...prev]);
      return res.data.room;
    } catch (err) {
      console.error('Failed to create room:', err);
      return null;
    }
  };

  const value = {
    socket,
    activeRoom,
    rooms,
    messages,
    unreadCount,
    joinRoom,
    leaveRoom,
    sendMessage,
    loadRooms,
    loadMessages,
    createRoom
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};