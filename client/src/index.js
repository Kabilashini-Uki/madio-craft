// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SecureChatProvider } from './context/SecureChatContext';
import { ChatProvider } from './context/ChatContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <SecureChatProvider>
          <ChatProvider>
            <App />
          </ChatProvider>
        </SecureChatProvider>
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);