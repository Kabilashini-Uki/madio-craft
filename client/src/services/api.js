// src/services/api.js
import axios from 'axios';

// Use environment variable with fallback
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('API Base URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(` ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      console.error(' Request timeout');
      return Promise.reject({ 
        message: 'Request timeout. Please check your connection and try again.',
        networkError: true 
      });
    }
    
    if (!error.response) {
      console.error(' Network Error - Cannot connect to server:', API_URL);
      return Promise.reject({ 
        message: `Cannot connect to server at ${API_URL}. Please make sure the backend is running.`,
        networkError: true 
      });
    }
    
    // Handle HTTP errors
    if (error.response) {
      console.error(' API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        data: error.response.data,
      });
      
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(error.response.data || error);
    }
    
    return Promise.reject({ message: error.message || 'An error occurred' });
  }
);

// Test connection function
export const testConnection = async () => {
  try {
    const response = await api.get('/health');
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Could not connect to server'
    };
  }
};

export default api;