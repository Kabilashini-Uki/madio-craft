// context/SocketContext.js
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated, loading } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    // Wait for auth to finish initialising, and only connect when we have a real user id
    if (loading) return;
    if (!isAuthenticated || !user?._id) {
      // Disconnect any existing socket when user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    // Avoid reconnecting when the same user is already connected
    if (socketRef.current?.connected) return;

    const socketUrl =
      process.env.REACT_APP_SOCKET_URL ||
      process.env.REACT_APP_API_URL?.replace('/api', '') ||
      'http://localhost:5000';

    const newSocket = io(socketUrl, {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      // user.id is the correct field (auth returns {id: user._id, ...})
      const userId = user.id || user._id;
      console.log(`Socket connected as user ${userId}`);
      newSocket.emit('register-user', userId);
      // Also emit join-user for legacy compatibility
      newSocket.emit('join-user', userId);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?._id, loading]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
