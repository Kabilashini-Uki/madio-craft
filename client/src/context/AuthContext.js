// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);

          // Verify token is still valid
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

          // Optional: Verify token with backend
          try {
            const response = await api.get('/auth/me');
            if (response.data.success) {
              setUser(response.data.user);
              setToken(storedToken);
            } else {
              // Token invalid, clear storage
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              delete api.defaults.headers.common['Authorization'];
            }
          } catch (error) {
            // Token verification failed, but we'll still use stored user
            setUser(parsedUser);
            setToken(storedToken);
          }
        }
      } catch (e) {
        console.error('Failed to restore auth state:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email);

      const res = await api.post('/auth/login', { email, password });
      console.log('Login response:', res.data);

      const { token, user } = res.data;

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      setToken(token);

      toast.success(`Welcome back, ${user.name}!`);
      return { success: true, user };

    } catch (err) {
      console.error('Login error:', err);
      let message = 'Login failed';

      if (err.message === 'Network Error' || err.message?.includes('connect')) {
        message = 'Cannot connect to server. Please make sure the backend is running (check REACT_APP_API_URL in .env).';
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message) {
        message = err.message;
      }

      toast.error(message);
      return { success: false, error: message, locked: err.response?.data?.locked || false, lockedUntil: err.response?.data?.lockedUntil || null };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Register attempt with data:', userData);

      const res = await api.post('/auth/register', userData);
      console.log('Register response:', res.data);

      const { token, user } = res.data;

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      setToken(token);

      toast.success('Welcome to the Madio Craft');
      return { success: true, user, token };

    } catch (err) {
      console.error('Registration error:', err);
      let message = 'Registration failed';

      if (err.message === 'Network Error' || err.message?.includes('connect')) {
        message = 'Cannot connect to server. Please make sure the backend is running (check REACT_APP_API_URL in .env).';
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message) {
        message = err.message;
      }

      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = (silent = false) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    delete api.defaults.headers.common['Authorization'];

    setUser(null);
    setToken(null);

    if (!silent) {
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    token,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};