// src/services/api.js
import axios from 'axios';

// Prefer explicit REACT_APP_API_URL. If not provided, fall back to localhost:5000/api (backend default).
// If your backend runs on a different port, set REACT_APP_API_URL in the client .env (e.g. REACT_APP_API_URL=http://localhost:5000/api)
const API_URL = process.env.REACT_APP_API_URL;

console.log('🌐 API Base URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(` API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    return config;
  },
  (error) => {
    console.error(' Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout');
      return Promise.reject({ message: 'Request timeout. Please try again.' });
    }
    
    if (error.response) {
      console.error('❌ API Error Response:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        data: error.response.data,
      });
      
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        console.log('🔐 Unauthorized - clearing auth state');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(error.response.data || error);
    } else if (error.request) {
      console.error(`❌ No response received from API (${API_URL}). Make sure backend is running and reachable.`);
      return Promise.reject({ 
        message: `Cannot connect to server at ${API_URL}. Please check if backend is running.` 
      });
    } else {
      console.error('❌ Request setup error:', error.message);
      return Promise.reject({ message: error.message || 'An error occurred' });
    }
  }
);

export default api;